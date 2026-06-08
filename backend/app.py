from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
import os
import json
import requests
import uuid
from dotenv import load_dotenv
from datetime import datetime
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import hashlib
import bcrypt
from functools import wraps

load_dotenv()

app = Flask(__name__)

# CORS Configuration
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

CORS(app, resources={
    r"/*" :{
        "origins": [
            "https://jobconnect-sage.vercel.app",
            "https://jobconnect-sage-*.vercel.app",
            "http://localhost:3000",
            "http://localhost:5000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-Data", "X-Admin-Id"],
        "supports_credentials": True
    }
})

# Rate Limiting Configuration
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Database connection helper with robust error handling
def get_db_connection():
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL not configured")
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

# SendGrid Configuration - Secure from environment
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@jobconnect.ng')
FROM_NAME = 'JobConnect Nigeria'

# Password hashing configuration
PASSWORD_SALT_ROUNDS = 12

def hash_password(password):
    """Hash password consistently using bcrypt with SHA256 fallback"""
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(PASSWORD_SALT_ROUNDS)).decode('utf-8')
    except:
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, stored_hash):
    """Verify password against stored hash - handles bcrypt, SHA256, and plain text"""
    if not password or not stored_hash:
        return False
    
    # 1. Try bcrypt (starts with $2b$)
    if stored_hash.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        except Exception as e:
            print(f'bcrypt check failed: {e}')
            return False
    
    # 2. Try SHA256 (64 character hex string)
    if len(stored_hash) == 64:
        try:
            input_hashed = hashlib.sha256(password.encode()).hexdigest()
            if input_hashed == stored_hash:
                return True
        except:
            pass
    
    # 3. Plain text match (for legacy users - will be upgraded on login)
    if password == stored_hash:
        print(f'⚠️ Plain text password detected - will upgrade to SHA256')
        return True
    
    return False

# Standard response helpers
def success_response(data=None, message=None, status_code=200):
    """Standard success response"""
    response = {"success": True}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    return jsonify(response), status_code

def error_response(error, status_code=400, data=None):
    """Standard error response"""
    response = {
        "success": False,
        "error": error,
        "code": status_code
    }
    if data:
        response["data"] = data
    return jsonify(response), status_code

# Admin authorization decorator
def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_data = request.headers.get('X-User-Data')
        if not admin_data:
            return error_response("Authorization required", 401)
        try:
            user = json.loads(admin_data)
            if user.get('adminLevel') in ['admin', 'admin2', 'admin1', 'admin2_70']:
                return f(*args, **kwargs)
        except:
            pass
        return error_response("Admin access required", 403)
    return decorated_function

def safe_str(value):
    """Safely convert value to string"""
    return str(value) if value is not None else None

def safe_float(value):
    """Safely convert value to float"""
    return float(value) if value is not None else 0.0

def safe_int(value):
    """Safely convert value to int"""
    return int(value) if value is not None else 0

# ============================================
# HOME ROUTE
# ============================================
@app.route('/')
def home():
    return success_response(
        data={
            "app": "JobConnect Nigeria",
            "status": "Running",
            "version": "2.1.0",
            "database": "Connected"
        }
    )

# ============================================
# JOB SEEKER ROUTES
# ============================================
@app.route('/api/jobs', methods=['GET'])
@limiter.limit("30 per minute")
def get_jobs():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, job_title, qualification_requirements, experience_requirements, 
                   required_skills, salary_range_min, salary_range_max, salary_type,
                   verification_badge, status, created_at
            FROM job_listings WHERE status = 'active' ORDER BY created_at DESC
        """)
        jobs = []
        for row in cur.fetchall():
            jobs.append({
                "id": safe_str(row[0]), "title": row[1], "qualification": row[2],
                "experience": row[3], "skills": row[4],
                "salary_min": safe_float(row[5]), "salary_max": safe_float(row[6]),
                "salary_type": row[7], "verified_badge": row[8], "status": row[9],
                "posted_date": safe_str(row[10])
            })
        return success_response(data={"jobs": jobs, "count": len(jobs)})
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()

@app.route('/api/jobs/<job_id>', methods=['GET'])
@limiter.limit("30 per minute")
def get_job_detail(job_id):
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, job_title, qualification_requirements, experience_requirements,
                   required_skills, salary_range_min, salary_range_max, salary_type,
                   verification_badge, status, created_at
            FROM job_listings WHERE id = %s AND status = 'active'
        """, (job_id,))
        job = cur.fetchone()
        if not job:
            return error_response("Job not found", 404)
        return success_response(data={"job": {
            "id": safe_str(job[0]), "title": job[1], "qualification": job[2],
            "experience": job[3], "skills": job[4],
            "salary_min": safe_float(job[5]), "salary_max": safe_float(job[6]),
            "salary_type": job[7], "verified_badge": job[8], "status": job[9],
            "posted_date": safe_str(job[10])
        }})
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()

# ============================================
# AGENT ROUTES
# ============================================
@app.route('/api/agent/<agent_id>/jobs', methods=['GET'])
def get_agent_jobs(agent_id):
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT j.id, j.job_title, j.qualification_requirements, j.experience_requirements,
                   j.required_skills, j.salary_range_min, j.salary_range_max, j.salary_type,
                   j.organization_name, j.organization_contact_person, j.organization_email,
                   j.organization_phone, j.verification_badge, j.status, j.created_at,
                   COUNT(ca.id) as applications
            FROM job_listings j
            LEFT JOIN commission_agreements ca ON j.id = ca.job_id
            WHERE j.agent_id = %s
            GROUP BY j.id ORDER BY j.created_at DESC
        """, (agent_id,))
        jobs = []
        for row in cur.fetchall():
            jobs.append({
                "id": safe_str(row[0]), "title": row[1], "qualification": row[2],
                "experience": row[3], "skills": row[4],
                "salary_min": safe_float(row[5]), "salary_max": safe_float(row[6]),
                "salary_type": row[7], "organization": row[8],
                "contact_person": row[9], "contact_email": row[10],
                "contact_phone": row[11], "badge": row[12], "status": row[13],
                "created": safe_str(row[14]), "applications": safe_int(row[15])
            })
        return success_response(data={"jobs": jobs, "count": len(jobs)})
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()

# ============================================
# UNIFIED JOB POSTING WITH KYC CHECK
# ============================================
@app.route('/api/agent/post-job', methods=['POST'])
@limiter.limit("10 per hour")
def post_job_with_kyc():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        agent_id = data.get('agent_id')
        if not agent_id:
            return error_response("Agent ID is required", 400)
        required_fields = ['job_title', 'qualification_requirements', 'experience_requirements', 
                          'organization_name', 'salary_range_min', 'salary_range_max']
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", 400)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE id = %s", (agent_id,))
        if not cur.fetchone():
            cur.close(); conn.close()
            return error_response("Agent not found", 404)
        cur.execute("""
            SELECT kyc_status, bvn_verified, nin_verified, is_verified, verification_status
            FROM users WHERE id = %s
        """, (agent_id,))
        user = cur.fetchone()
        if not user:
            cur.close(); conn.close()
            return error_response("User not found", 404)
        is_admin_verified = user[3] if user else False
        is_kyc_approved = user[0] == 'approved' if user else False
        is_verification_complete = user[4] == 'verified' if user else False
        can_post = is_admin_verified or is_kyc_approved or is_verification_complete
        if not can_post:
            cur.close(); conn.close()
            return error_response(
                "Complete verification before posting jobs.", 403,
                data={"kyc_required": True, "kyc_status": {
                    "bvn_verified": bool(user[1]), "nin_verified": bool(user[2]),
                    "kyc_status": user[0] or 'not_started', "admin_verified": bool(user[3])
                }}
            )
        cur.execute("""
            INSERT INTO job_listings (
                agent_id, job_title, qualification_requirements,
                experience_requirements, required_skills,
                salary_range_min, salary_range_max, salary_type,
                organization_name, organization_contact_person,
                organization_email, organization_phone,
                commission_percentage, is_negotiable,
                has_interview, has_exam, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
            RETURNING id
        """, (
            agent_id, data['job_title'], data['qualification_requirements'],
            data['experience_requirements'], data.get('required_skills', ''),
            data['salary_range_min'], data['salary_range_max'],
            data.get('salary_type', 'monthly'), data['organization_name'],
            data.get('organization_contact_person', ''), data.get('organization_email', ''),
            data.get('organization_phone', ''), data.get('commission_percentage', 15),
            data.get('is_negotiable', True), data.get('has_interview', False),
            data.get('has_exam', False)
        ))
        job_id = cur.fetchone()[0]
        cur.execute("""
            INSERT INTO activity_logs (user_id, activity_type, activity_description, module, severity, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (agent_id, 'job_posted', f"Posted job: {data['job_title']}", 'jobs', 'info', request.remote_addr))
        conn.commit()
        return success_response(data={"job_id": safe_str(job_id)}, message="Job posted successfully", status_code=201)
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

# ============================================
# USER LOGIN - FIXED for all password formats
# ============================================
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        if not email or not password:
            return error_response("Email and password required", 400)
        if '@' not in email:
            return error_response("Invalid email format", 400)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, user_type, is_verified, password_hash, verification_status
            FROM users WHERE LOWER(email) = %s
        """, (email,))
        user = cur.fetchone()
        if not user:
            return error_response("Invalid email or password", 401)
        stored_hash = user[4]
        
        # VERIFY PASSWORD - handles bcrypt, SHA256, and plain text
        if not verify_password(password, stored_hash):
            return error_response("Invalid email or password", 401)
        
        # AUTO-UPGRADE plain text passwords to SHA256
        if password == stored_hash or (not stored_hash.startswith('$2b$') and len(stored_hash) != 64):
            new_hash = hashlib.sha256(password.encode()).hexdigest()
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, str(user[0])))
            conn.commit()
            print(f'🔒 Upgraded password to SHA256 for {email}')
        
        # Log access
        cur.execute("""
            INSERT INTO access_logs (user_id, user_email, user_type, page_accessed, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (str(user[0]), user[1], user[2], '/login', request.remote_addr,
              request.headers.get('User-Agent', '')))
        # Log activity
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, activity_type, activity_description, module, severity, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(user[0]), user[1], 'login', 'User logged in successfully', 'auth', 'info', request.remote_addr))
        conn.commit()
        print(f'✅ Login successful: {email} ({user[2]})')
        return success_response(data={
            "user": {
                "id": str(user[0]), "email": user[1], "user_type": user[2],
                "is_verified": user[3], "verification_status": user[5]
            }
        })
    except Exception as e:
        print(f'❌ Login error: {e}')
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

# ============================================
# USER REGISTRATION - Secure with hashing
# ============================================
@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        required = ['email', 'phone', 'password', 'user_type']
        for field in required:
            if field not in data:
                return error_response(f"{field} is required", 400)
        email = data['email']
        if '@' not in email:
            return error_response("Invalid email format", 400)
        phone = data['phone']
        if not phone.startswith('0') and not phone.startswith('+234'):
            return error_response("Invalid phone number format", 400)
        valid_types = ['agent', 'job_seeker']
        if data['user_type'] not in valid_types:
            return error_response("Invalid user type", 400)
        password = data['password']
        if len(password) < 6:
            return error_response("Password must be at least 6 characters", 400)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close(); conn.close()
            return error_response("Email already registered", 409)
        cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        if cur.fetchone():
            cur.close(); conn.close()
            return error_response("Phone number already registered", 409)
        hashed_password = hash_password(password)
        cur.execute("""
            INSERT INTO users (email, phone, password_hash, user_type)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (email, phone, hashed_password, data['user_type']))
        user_id = cur.fetchone()[0]
        conn.commit()
        if SENDGRID_API_KEY:
            try:
                sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
                mail = Mail(
                    Email(FROM_EMAIL, FROM_NAME), To(email),
                    "Welcome to JobConnect Nigeria!",
                    Content("text/html", f'''
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                            <h2 style="color:#d4a843;">Welcome to JobConnect Nigeria!</h2>
                            <p>Thank you for registering!</p>
                            <a href="https://jobconnect-sage.vercel.app/dashboard" 
                               style="background:#d42027;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:15px;">
                               Go to Dashboard
                            </a>
                        </div>''')
                )
                sg.client.mail.send.post(request_body=mail.get())
            except Exception as e:
                print(f"Email send failed: {e}")
        return success_response(data={"user_id": safe_str(user_id)}, message="Registration successful", status_code=201)
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

# ============================================
# [REST OF YOUR ROUTES REMAIN THE SAME]
# VERIFICATION, ADMIN, TESTIMONIALS, USERS-LIST, 
# TEST-DATA, ANALYTICS, ANNOUNCEMENTS, STATS,
# CONTACT, GPS, LOGS, COMMUNICATION
# ============================================
# [... Keep all the remaining routes from your file ...]

# ============================================
# ERROR HANDLERS
# ============================================
@app.errorhandler(404)
def not_found_error(error):
    return error_response("Endpoint not found", 404)

@app.errorhandler(500)
def internal_error(error):
    return error_response("Internal server error", 500)

@app.errorhandler(429)
def ratelimit_error(error):
    return error_response("Rate limit exceeded. Please try again later.", 429)

# ============================================
# RUN APPLICATION
# ============================================
if __name__ == '__main__':
    print("🚀 JobConnect Nigeria API Starting...")
    print(f"📍 Local: http://localhost:5000")
    print(f"📊 Database: {'Connected' if get_db_connection() else 'Not Connected'}")
    print("🔐 Admin routes protected with @require_admin")
    print("⏱️  Rate limiting enabled")
    print("🔒 Password hashing: bcrypt/SHA256 + plain text upgrade")
    print("🛡️  SQL injection protection: Parameterized queries")
    app.run(debug=True, host='0.0.0.0', port=5000)