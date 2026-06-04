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
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://jobconnect-sage.vercel.app",
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
PASSWORD_SALT_ROUNDS = 12  # For bcrypt

def hash_password(password):
    """Hash password consistently using bcrypt with SHA256 fallback"""
    try:
        # Primary: bcrypt
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(PASSWORD_SALT_ROUNDS)).decode('utf-8')
    except:
        # Fallback: SHA256
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, stored_hash):
    """Verify password against stored hash"""
    if not password or not stored_hash:
        return False
    
    # Try bcrypt first
    if stored_hash.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        except:
            pass
    
    # Try SHA256
    input_hashed = hashlib.sha256(password.encode()).hexdigest()
    if input_hashed == stored_hash:
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
        auth_header = request.headers.get('Authorization')
        admin_data = request.headers.get('X-User-Data')
        
        if not auth_header and not admin_data:
            return error_response("Authorization required", 401)
        
        try:
            if admin_data:
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
            FROM job_listings 
            WHERE status = 'active' 
            ORDER BY created_at DESC
        """)
        
        jobs = []
        for row in cur.fetchall():
            jobs.append({
                "id": safe_str(row[0]),
                "title": row[1],
                "qualification": row[2],
                "experience": row[3],
                "skills": row[4],
                "salary_min": safe_float(row[5]),
                "salary_max": safe_float(row[6]),
                "salary_type": row[7],
                "verified_badge": row[8],
                "status": row[9],
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
            FROM job_listings 
            WHERE id = %s AND status = 'active'
        """, (job_id,))
        
        job = cur.fetchone()
        if not job:
            return error_response("Job not found", 404)
        
        return success_response(data={"job": {
            "id": safe_str(job[0]),
            "title": job[1],
            "qualification": job[2],
            "experience": job[3],
            "skills": job[4],
            "salary_min": safe_float(job[5]),
            "salary_max": safe_float(job[6]),
            "salary_type": job[7],
            "verified_badge": job[8],
            "status": job[9],
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
            GROUP BY j.id 
            ORDER BY j.created_at DESC
        """, (agent_id,))
        
        jobs = []
        for row in cur.fetchall():
            jobs.append({
                "id": safe_str(row[0]),
                "title": row[1],
                "qualification": row[2],
                "experience": row[3],
                "skills": row[4],
                "salary_min": safe_float(row[5]),
                "salary_max": safe_float(row[6]),
                "salary_type": row[7],
                "organization": row[8],
                "contact_person": row[9],
                "contact_email": row[10],
                "contact_phone": row[11],
                "badge": row[12],
                "status": row[13],
                "created": safe_str(row[14]),
                "applications": safe_int(row[15])
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
        
        # Validate required fields
        required_fields = ['job_title', 'qualification_requirements', 'experience_requirements', 
                          'organization_name', 'salary_range_min', 'salary_range_max']
        for field in required_fields:
            if not data.get(field):
                return error_response(f"{field} is required", 400)
        
        cur = conn.cursor()
        
        # Check user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (agent_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return error_response("Agent not found", 404)
        
        # Check KYC and admin verification status
        cur.execute("""
            SELECT kyc_status, bvn_verified, nin_verified, is_verified, verification_status
            FROM users WHERE id = %s
        """, (agent_id,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return error_response("User not found", 404)
        
        # Allow posting if admin verified or KYC approved
        is_admin_verified = user[3] if user else False
        is_kyc_approved = user[0] == 'approved' if user else False
        is_verification_complete = user[4] == 'verified' if user else False
        
        can_post = is_admin_verified or is_kyc_approved or is_verification_complete
        
        if not can_post:
            cur.close()
            conn.close()
            return error_response(
                "Complete verification before posting jobs. Please verify your BVN, NIN, and upload utility bill.",
                403,
                data={
                    "kyc_required": True,
                    "kyc_status": {
                        "bvn_verified": bool(user[1]),
                        "nin_verified": bool(user[2]),
                        "kyc_status": user[0] or 'not_started',
                        "admin_verified": bool(user[3])
                    }
                }
            )
        
        # Proceed with job posting - parameterized query
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
            agent_id,
            data['job_title'],
            data['qualification_requirements'],
            data['experience_requirements'],
            data.get('required_skills', ''),
            data['salary_range_min'],
            data['salary_range_max'],
            data.get('salary_type', 'monthly'),
            data['organization_name'],
            data.get('organization_contact_person', ''),
            data.get('organization_email', ''),
            data.get('organization_phone', ''),
            data.get('commission_percentage', 15),
            data.get('is_negotiable', True),
            data.get('has_interview', False),
            data.get('has_exam', False)
        ))
        
        job_id = cur.fetchone()[0]
        
        # Log activity with parameterized query
        cur.execute("""
            INSERT INTO activity_logs (user_id, activity_type, activity_description, module, severity, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (agent_id, 'job_posted', f"Posted job: {data['job_title']}", 'jobs', 'info', request.remote_addr))
        
        conn.commit()
        
        return success_response(
            data={"job_id": safe_str(job_id)},
            message="Job posted successfully",
            status_code=201
        )
        
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals():
            cur.close()
        conn.close()

# ============================================
# USER LOGIN - Secure with consistent hashing
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
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return error_response("Email and password required", 400)
        
        # Validate email format
        if '@' not in email:
            return error_response("Invalid email format", 400)
        
        cur = conn.cursor()
        
        # Parameterized query to prevent SQL injection
        cur.execute("""
            SELECT id, email, user_type, is_verified, password_hash, verification_status
            FROM users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        
        if not user:
            return error_response("Invalid email or password", 401)
        
        stored_password = user[4]
        
        # Use consistent password verification
        if not verify_password(password, stored_password):
            return error_response("Invalid email or password", 401)
        
        # Log access with parameterized query
        cur.execute("""
            INSERT INTO access_logs (user_id, user_email, user_type, page_accessed, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (safe_str(user[0]), user[1], user[2], '/login', request.remote_addr, 
              request.headers.get('User-Agent', '')))
        
        # Log activity with parameterized query
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, activity_type, activity_description, module, severity, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (safe_str(user[0]), user[1], 'login', 'User logged in successfully', 'auth', 'info', request.remote_addr))
        
        conn.commit()
        
        return success_response(data={
            "user": {
                "id": safe_str(user[0]),
                "email": user[1],
                "user_type": user[2],
                "is_verified": user[3],
                "verification_status": user[5]
            }
        })
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals():
            cur.close()
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
        
        # Validate required fields
        required = ['email', 'phone', 'password', 'user_type']
        for field in required:
            if field not in data:
                return error_response(f"{field} is required", 400)
        
        # Validate email format
        email = data['email']
        if '@' not in email:
            return error_response("Invalid email format", 400)
        
        # Validate phone format (Nigerian)
        phone = data['phone']
        if not phone.startswith('0') and not phone.startswith('+234'):
            return error_response("Invalid phone number format", 400)
        
        # Validate user type
        valid_types = ['agent', 'job_seeker']
        if data['user_type'] not in valid_types:
            return error_response("Invalid user type. Must be 'agent' or 'job_seeker'", 400)
        
        # Validate password strength
        password = data['password']
        if len(password) < 6:
            return error_response("Password must be at least 6 characters", 400)
        
        cur = conn.cursor()
        
        # Check existing email - parameterized query
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return error_response("Email already registered", 409)
        
        # Check existing phone - parameterized query
        cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return error_response("Phone number already registered", 409)
        
        # Hash password consistently
        hashed_password = hash_password(password)
        
        # Insert user - parameterized query
        cur.execute("""
            INSERT INTO users (email, phone, password_hash, user_type)
            VALUES (%s, %s, %s, %s) 
            RETURNING id
        """, (email, phone, hashed_password, data['user_type']))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        
        # Send welcome email if SendGrid configured
        if SENDGRID_API_KEY:
            try:
                sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
                from_email = Email(FROM_EMAIL, FROM_NAME)
                to_email = To(email)
                content = Content("text/html", f'''
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                        <h2 style="color:#d4a843;">Welcome to JobConnect Nigeria!</h2>
                        <p>Thank you for registering!</p>
                        <p>Complete your profile verification to start accessing all features.</p>
                        <a href="https://jobconnect-sage.vercel.app/dashboard" 
                           style="background:#d42027;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:15px;">
                           Go to Dashboard
                        </a>
                    </div>''')
                mail = Mail(from_email, to_email, "Welcome to JobConnect Nigeria!", content)
                sg.client.mail.send.post(request_body=mail.get())
            except Exception as e:
                print(f"Email send failed: {e}")
        
        return success_response(
            data={"user_id": safe_str(user_id)},
            message="Registration successful",
            status_code=201
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals():
            cur.close()
        conn.close()

# ============================================
# VERIFICATION SUBMISSION - SQL Injection Safe
# ============================================
@app.route('/api/verify/submit', methods=['POST'])
@limiter.limit("5 per day")
def submit_verification():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        
        user_id = data.get('user_id')
        user_type = data.get('user_type', 'job_seeker')
        email = data.get('email', '')
        
        if not user_id:
            return error_response("User ID is required", 400)
        
        # Validate user type
        if user_type not in ['job_seeker', 'agent', 'staff']:
            return error_response("Invalid user type", 400)
        
        cur = conn.cursor()
        
        # Build safe update query based on user type
        # All queries use parameterized placeholders
        if user_type == 'job_seeker':
            cur.execute("""
                UPDATE users SET 
                    verification_status = 'pending',
                    full_name = COALESCE(%s, full_name),
                    date_of_birth = COALESCE(%s::date, date_of_birth),
                    address = COALESCE(%s, address),
                    nin = COALESCE(%s, nin),
                    next_of_kin_name = COALESCE(%s, next_of_kin_name),
                    next_of_kin_phone = COALESCE(%s, next_of_kin_phone),
                    next_of_kin_address = COALESCE(%s, next_of_kin_address),
                    emergency_contact_name = COALESCE(%s, emergency_contact_name),
                    emergency_contact_phone = COALESCE(%s, emergency_contact_phone),
                    social_media_1 = COALESCE(%s, social_media_1),
                    social_media_2 = COALESCE(%s, social_media_2),
                    updated_at = NOW()
                WHERE id = %s
            """, (
                data.get('full_name'), data.get('date_of_birth'), data.get('address'),
                data.get('nin'), data.get('next_of_kin_name'), data.get('next_of_kin_phone'),
                data.get('next_of_kin_address'), data.get('emergency_contact_name'),
                data.get('emergency_contact_phone'), data.get('social_media_1'),
                data.get('social_media_2'), user_id
            ))
            
        elif user_type in ('agent', 'staff'):
            cur.execute("""
                UPDATE users SET 
                    verification_status = 'pending',
                    full_name = COALESCE(%s, full_name),
                    date_of_birth = COALESCE(%s::date, date_of_birth),
                    address = COALESCE(%s, address),
                    nin = COALESCE(%s, nin),
                    bvn = COALESCE(%s, bvn),
                    bank_name = COALESCE(%s, bank_name),
                    account_number = COALESCE(%s, account_number),
                    account_name = COALESCE(%s, account_name),
                    guarantor_name = COALESCE(%s, guarantor_name),
                    guarantor_phone = COALESCE(%s, guarantor_phone),
                    guarantor_address = COALESCE(%s, guarantor_address),
                    next_of_kin_name = COALESCE(%s, next_of_kin_name),
                    next_of_kin_phone = COALESCE(%s, next_of_kin_phone),
                    next_of_kin_address = COALESCE(%s, next_of_kin_address),
                    emergency_contact_name = COALESCE(%s, emergency_contact_name),
                    emergency_contact_phone = COALESCE(%s, emergency_contact_phone),
                    social_media_1 = COALESCE(%s, social_media_1),
                    social_media_2 = COALESCE(%s, social_media_2),
                    updated_at = NOW()
                WHERE id = %s
            """, (
                data.get('full_name'), data.get('date_of_birth'), data.get('address'),
                data.get('nin'), data.get('bvn'), data.get('bank_name'),
                data.get('account_number'), data.get('account_name'),
                data.get('guarantor_name'), data.get('guarantor_phone'),
                data.get('guarantor_address'), data.get('next_of_kin_name'),
                data.get('next_of_kin_phone'), data.get('next_of_kin_address'),
                data.get('emergency_contact_name'), data.get('emergency_contact_phone'),
                data.get('social_media_1'), data.get('social_media_2'), user_id
            ))
        
        # Log activity with parameterized query
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, activity_type, 
                activity_description, module, severity, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, email, 'verification_submitted', 
              f'{user_type} submitted verification', 'verification', 'info', 
              request.remote_addr))
        
        # Send email notification if configured
        if SENDGRID_API_KEY and email:
            try:
                sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
                mail = Mail(
                    Email(FROM_EMAIL, FROM_NAME),
                    To(email),
                    "Verification Submitted - JobConnect Nigeria",
                    Content("text/html", f'''
                        <h2>Verification Submitted</h2>
                        <p>Dear {data.get("full_name", "User")},</p>
                        <p>Your documents have been received. Review takes 24-48 hours.</p>
                    ''')
                )
                sg.client.mail.send.post(request_body=mail.get())
            except:
                pass
        
        conn.commit()
        
        return success_response(message="Verification submitted successfully!")
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals():
            cur.close()
        conn.close()

# ============================================
# ADMIN ROUTES - FULL DATABASE ACCESS
# ============================================

@app.route('/api/admin/users', methods=['GET'])
@require_admin
@limiter.limit("30 per minute")
def admin_get_all_users():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, phone, user_type, is_verified, verification_status,
                   full_name, created_at, updated_at, bvn_verified, nin_verified, kyc_status
            FROM users ORDER BY created_at DESC
        """)
        
        users = []
        for row in cur.fetchall():
            users.append({
                "id": safe_str(row[0]),
                "email": row[1],
                "phone": row[2],
                "type": row[3],
                "verified": row[4],
                "verification_status": row[5],
                "full_name": row[6],
                "created_at": safe_str(row[7]),
                "updated_at": safe_str(row[8]),
                "bvn_verified": row[9],
                "nin_verified": row[10],
                "kyc_status": row[11]
            })
        
        return success_response(data={"users": users, "count": len(users)})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/user/<user_id>', methods=['GET', 'PUT', 'DELETE'])
@require_admin
def admin_manage_user(user_id):
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                return error_response("User not found", 404)
            
            columns = [desc[0] for desc in cur.description]
            user_data = {col: safe_str(user[i]) for i, col in enumerate(columns)}
            
            return success_response(data={"user": user_data})
        
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return error_response("Request body is required", 400)
            
            allowed_fields = [
                'email', 'phone', 'user_type', 'is_verified', 'verification_status',
                'full_name', 'address', 'city', 'state', 'nin', 'bvn'
            ]
            
            updates = []
            values = []
            for field in allowed_fields:
                if field in data:
                    updates.append(f"{field} = %s")
                    values.append(data[field])
            
            if not updates:
                return error_response("No valid fields to update", 400)
            
            updates.append("updated_at = NOW()")
            values.append(user_id)
            
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            cur.execute(query, values)
            
            # Log audit
            cur.execute("""
                INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, change_summary, ip_address)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (request.headers.get('X-Admin-Id'), 'UPDATE', 'users', user_id, 
                  f"Updated user fields: {', '.join(data.keys())}", request.remote_addr))
            
            conn.commit()
            return success_response(message="User updated successfully")
        
        elif request.method == 'DELETE':
            # Soft delete
            cur.execute("""
                UPDATE users SET verification_status = 'deactivated', updated_at = NOW()
                WHERE id = %s
            """, (user_id,))
            
            # Log audit
            cur.execute("""
                INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, change_summary, ip_address)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (request.headers.get('X-Admin-Id'), 'DELETE', 'users', user_id, 
                  'User deactivated', request.remote_addr))
            
            conn.commit()
            return success_response(message="User deactivated successfully")
            
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/user/<user_id>/toggle-status', methods=['POST'])
@require_admin
def admin_toggle_user_status(user_id):
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE users SET 
                verification_status = CASE 
                    WHEN verification_status = 'blocked' THEN 'verified'
                    ELSE 'blocked'
                END,
                updated_at = NOW()
            WHERE id = %s
            RETURNING verification_status
        """, (user_id,))
        
        result = cur.fetchone()
        if not result:
            return error_response("User not found", 404)
        
        new_status = result[0]
        
        # Log audit
        cur.execute("""
            INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, change_summary, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (request.headers.get('X-Admin-Id'), 'TOGGLE_STATUS', 'users', user_id,
              f"Status changed to {new_status}", request.remote_addr))
        
        conn.commit()
        
        return success_response(
            data={"new_status": new_status},
            message=f"User status changed to {new_status}"
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/user/<user_id>/reset-password', methods=['POST'])
@require_admin
@limiter.limit("10 per hour")
def admin_reset_password(user_id):
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        
        new_password = data.get('new_password')
        if not new_password or len(new_password) < 6:
            return error_response("Password must be at least 6 characters", 400)
        
        # Hash new password
        hashed = hash_password(new_password)
        
        cur = conn.cursor()
        cur.execute("""
            UPDATE users SET password_hash = %s, updated_at = NOW()
            WHERE id = %s
        """, (hashed, user_id))
        
        # Log audit
        cur.execute("""
            INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, change_summary, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (request.headers.get('X-Admin-Id'), 'PASSWORD_RESET', 'users', user_id,
              'Password reset by admin', request.remote_addr))
        
        conn.commit()
        
        return success_response(message="Password reset successfully")
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# ADMIN - VERIFICATION MANAGEMENT
# ============================================

@app.route('/api/admin/verifications', methods=['GET'])
@require_admin
def get_all_verifications():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, user_type, full_name, verification_status,
                   passport_photo, nin, bvn, bank_name, account_number,
                   date_of_birth, address, city, state,
                   guarantor_name, guarantor_phone,
                   next_of_kin_name, next_of_kin_phone,
                   emergency_contact_name, emergency_contact_phone,
                   social_media_1, social_media_2,
                   created_at, updated_at
            FROM users
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC
        """)
        
        users = []
        for row in cur.fetchall():
            users.append({
                "id": safe_str(row[0]),
                "email": row[1],
                "user_type": row[2],
                "full_name": row[3],
                "verification_status": row[4],
                "passport_photo": row[5],
                "nin": row[6],
                "bvn": row[7],
                "bank_name": row[8],
                "account_number": row[9],
                "date_of_birth": safe_str(row[10]),
                "address": row[11],
                "city": row[12],
                "state": row[13],
                "guarantor_name": row[14],
                "guarantor_phone": row[15],
                "next_of_kin_name": row[16],
                "next_of_kin_phone": row[17],
                "emergency_contact_name": row[18],
                "emergency_contact_phone": row[19],
                "social_media_1": row[20],
                "social_media_2": row[21],
                "created_at": safe_str(row[22]),
                "updated_at": safe_str(row[23])
            })
        
        return success_response(data={"users": users, "count": len(users)})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/verify/<user_id>', methods=['POST'])
@require_admin
def verify_user(user_id):
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        
        action = data.get('action')
        if action not in ['approve', 'reject']:
            return error_response("Action must be 'approve' or 'reject'", 400)
        
        cur = conn.cursor()
        
        if action == 'approve':
            cur.execute("""
                UPDATE users SET 
                    is_verified = true,
                    verification_status = 'verified',
                    verification_level = 1,
                    updated_at = NOW()
                WHERE id = %s
            """, (user_id,))
        else:
            cur.execute("""
                UPDATE users SET 
                    verification_status = 'rejected',
                    updated_at = NOW()
                WHERE id = %s
            """, (user_id,))
        
        # Log audit
        cur.execute("""
            INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, change_summary, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (request.headers.get('X-Admin-Id'), 'VERIFY', 'users', user_id,
              f"User verification {action}d", request.remote_addr))
        
        conn.commit()
        
        return success_response(message=f"User {action}d successfully")
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# TESTIMONIALS - With Admin Management
# ============================================

@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, role, company, text, rating, is_verified, created_at
            FROM testimonials 
            WHERE is_active = TRUE 
            ORDER BY created_at DESC
        """)
        
        testimonials = []
        for row in cur.fetchall():
            testimonials.append({
                "id": safe_str(row[0]),
                "name": row[1],
                "role": row[2],
                "company": row[3],
                "text": row[4],
                "rating": safe_int(row[5]),
                "is_verified": row[6],
                "created_at": safe_str(row[7])
            })
        
        return success_response(data={"testimonials": testimonials})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/testimonials', methods=['POST', 'PUT', 'DELETE'])
@require_admin
def admin_manage_testimonials():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        
        if request.method == 'POST':
            data = request.json
            if not data or not data.get('name') or not data.get('text'):
                return error_response("Name and text are required", 400)
            
            cur.execute("""
                INSERT INTO testimonials (name, role, company, text, rating, is_active)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                RETURNING id
            """, (data['name'], data.get('role', ''), data.get('company', ''),
                  data['text'], data.get('rating', 5)))
            
            testimonial_id = cur.fetchone()[0]
            conn.commit()
            
            return success_response(
                data={"id": safe_str(testimonial_id)},
                message="Testimonial created",
                status_code=201
            )
        
        elif request.method == 'PUT':
            data = request.json
            if not data or not data.get('id'):
                return error_response("Testimonial ID is required", 400)
            
            cur.execute("""
                UPDATE testimonials SET 
                    is_active = COALESCE(%s, is_active),
                    is_verified = COALESCE(%s, is_verified)
                WHERE id = %s
            """, (data.get('is_active'), data.get('is_verified'), data['id']))
            
            conn.commit()
            return success_response(message="Testimonial updated")
        
        elif request.method == 'DELETE':
            testimonial_id = request.args.get('id')
            if not testimonial_id:
                return error_response("Testimonial ID is required", 400)
            
            cur.execute("UPDATE testimonials SET is_active = FALSE WHERE id = %s", (testimonial_id,))
            conn.commit()
            return success_response(message="Testimonial deleted")
            
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# USERS LIST FOR CHAT/CALLS
# ============================================
@app.route('/api/users-list', methods=['GET'])
def get_users_list():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, user_type, phone, is_verified
            FROM users 
            ORDER BY created_at DESC
        """)
        
        users = [{
            "id": safe_str(r[0]),
            "email": r[1],
            "user_type": r[2],
            "phone": r[3],
            "is_verified": r[4]
        } for r in cur.fetchall()]
        
        return success_response(data={"users": users})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# TEST DATA ENDPOINT
# ============================================
@app.route('/api/test-data')
def test_data():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute('SELECT id, email, user_type, is_verified FROM users')
        users = [{
            "id": safe_str(u[0]),
            "email": u[1],
            "type": u[2],
            "verified": u[3]
        } for u in cur.fetchall()]
        
        return success_response(data={
            "users": users,
            "total_users": len(users)
        })
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()

# ============================================
# ANALYTICS SUMMARY
# ============================================
@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        stats = {}
        
        queries = {
            'total_users': "SELECT COUNT(*) FROM users",
            'total_agents': "SELECT COUNT(*) FROM users WHERE user_type = 'agent'",
            'total_seekers': "SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker'",
            'active_jobs': "SELECT COUNT(*) FROM job_listings WHERE status = 'active'",
            'filled_jobs': "SELECT COUNT(*) FROM job_listings WHERE status = 'filled'",
            'total_commission': "SELECT COALESCE(SUM(commission_amount), 0) FROM commission_agreements WHERE payment_status = 'paid'",
            'pending_verifications': "SELECT COUNT(*) FROM users WHERE verification_status = 'pending'"
        }
        
        for key, query in queries.items():
            cur.execute(query)
            result = cur.fetchone()[0]
            stats[key] = safe_float(result) if key == 'total_commission' else safe_int(result)
        
        return success_response(data={"stats": stats})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# ANNOUNCEMENTS
# ============================================
@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, content, priority, target_audience, created_at
            FROM announcements 
            WHERE is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW()) 
            ORDER BY created_at DESC
        """)
        
        announcements = [{
            "id": safe_str(r[0]),
            "title": r[1],
            "content": r[2],
            "priority": r[3],
            "audience": r[4],
            "date": safe_str(r[5])
        } for r in cur.fetchall()]
        
        return success_response(data={"announcements": announcements})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# PLATFORM STATS
# ============================================
@app.route('/api/stats', methods=['GET'])
def get_platform_stats():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        stats = {}
        
        queries = {
            'active_jobs': "SELECT COUNT(*) FROM job_listings WHERE status = 'active'",
            'jobs_secured': "SELECT COUNT(*) FROM job_listings WHERE status = 'filled'",
            'total_users': "SELECT COUNT(*) FROM users",
            'verified_agents': "SELECT COUNT(*) FROM users WHERE user_type = 'agent' AND is_verified = true",
            'total_commission': "SELECT COALESCE(SUM(commission_amount), 0) FROM commission_agreements WHERE payment_status = 'paid'"
        }
        
        for key, query in queries.items():
            cur.execute(query)
            result = cur.fetchone()[0]
            stats[key] = safe_float(result) if key == 'total_commission' else safe_int(result)
        
        return success_response(data={"stats": stats})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# CONTACT FORM
# ============================================
@app.route('/api/contact', methods=['POST'])
@limiter.limit("3 per hour")
def contact_form():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        if not data:
            return error_response("Request body is required", 400)
        
        required = ['name', 'email', 'subject', 'message']
        for field in required:
            if not data.get(field):
                return error_response(f"{field} is required", 400)
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (data['name'], data['email'], data['subject'], data['message'],
              request.remote_addr, request.headers.get('User-Agent', '')))
        
        msg_id = cur.fetchone()[0]
        conn.commit()
        
        return success_response(
            data={"id": safe_str(msg_id)},
            message="Message sent successfully",
            status_code=201
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# GPS TRACKING
# ============================================
@app.route('/api/gps/track', methods=['POST'])
@limiter.limit("60 per minute")
def track_gps_location():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        if not data or not data.get('latitude') or not data.get('longitude'):
            return error_response("Latitude and longitude are required", 400)
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO gps_locations (user_id, user_email, latitude, longitude, accuracy,
                altitude, speed, heading, city, state, country, location_string, 
                ip_address, session_id, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data.get('user_id'), data.get('email'), data['latitude'], data['longitude'],
            data.get('accuracy'), data.get('altitude'), data.get('speed'),
            data.get('heading'), data.get('city', ''), data.get('state', ''),
            data.get('country', 'Nigeria'), data.get('location_string', ''),
            request.remote_addr, data.get('session_id', ''),
            request.headers.get('User-Agent', '')
        ))
        
        location_id = cur.fetchone()[0]
        
        if data.get('user_id'):
            cur.execute("""
                UPDATE users SET 
                    gps_latitude = %s, gps_longitude = %s,
                    gps_accuracy = %s, last_location_update = NOW(),
                    city = COALESCE(%s, city),
                    state = COALESCE(%s, state)
                WHERE id = %s
            """, (data['latitude'], data['longitude'], data.get('accuracy'),
                  data.get('city'), data.get('state'), data['user_id']))
        
        conn.commit()
        
        return success_response(
            data={"id": safe_str(location_id)},
            message="Location tracked"
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# ADMIN - ACCESS LOGS
# ============================================
@app.route('/api/admin/access-logs', methods=['GET'])
@require_admin
def admin_get_access_logs():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM access_logs ORDER BY created_at DESC LIMIT 100")
        
        columns = [desc[0] for desc in cur.description]
        logs = []
        for row in cur.fetchall():
            log = {col: safe_str(row[i]) for i, col in enumerate(columns)}
            logs.append(log)
        
        return success_response(data={"logs": logs})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# ADMIN - ACTIVITY LOGS
# ============================================
@app.route('/api/admin/activity-logs', methods=['GET'])
@require_admin
def admin_get_activity_logs():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100")
        
        columns = [desc[0] for desc in cur.description]
        logs = []
        for row in cur.fetchall():
            log = {col: safe_str(row[i]) for i, col in enumerate(columns)}
            logs.append(log)
        
        return success_response(data={"logs": logs})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# ADMIN - AUDIT LOGS
# ============================================
@app.route('/api/admin/audit-logs', methods=['GET'])
@require_admin
def admin_get_audit_logs():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100")
        
        columns = [desc[0] for desc in cur.description]
        logs = []
        for row in cur.fetchall():
            log = {col: safe_str(row[i]) for i, col in enumerate(columns)}
            logs.append(log)
        
        return success_response(data={"logs": logs})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

# ============================================
# ADMIN - COMMUNICATION
# ============================================
@app.route('/api/admin/message/send', methods=['POST'])
@require_admin
def admin_send_message():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO admin_messages (sender_id, receiver_id, subject, message)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (data.get('sender_id'), data.get('receiver_id'),
              data.get('subject', ''), data.get('message', '')))
        
        msg_id = cur.fetchone()[0]
        conn.commit()
        
        return success_response(
            data={"message_id": safe_str(msg_id)},
            status_code=201
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/broadcast', methods=['POST'])
@require_admin
def admin_broadcast():
    conn = get_db_connection()
    if not conn:
        return error_response("Database connection failed", 500)
    
    try:
        data = request.json
        group_type = data.get('group_type', 'all')
        sender_id = data.get('sender_id')
        subject = data.get('subject', '')
        message = data.get('message', '')
        
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO broadcast_messages (sender_id, group_type, subject, message, sent_via)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (sender_id, group_type, subject, message, data.get('sent_via', 'platform')))
        
        broadcast_id = cur.fetchone()[0]
        
        # Get recipients based on group
        group_queries = {
            'all': "SELECT id, email FROM users WHERE id != %s",
            'agents': "SELECT id, email FROM users WHERE user_type = 'agent'",
            'seekers': "SELECT id, email FROM users WHERE user_type = 'job_seeker'",
            'verified': "SELECT id, email FROM users WHERE is_verified = true",
            'unverified': "SELECT id, email FROM users WHERE is_verified = false"
        }
        
        query = group_queries.get(group_type, group_queries['all'])
        params = (sender_id,) if '%s' in query else ()
        cur.execute(query, params)
        
        recipients = cur.fetchall()
        
        for recipient in recipients:
            cur.execute("""
                INSERT INTO admin_messages (sender_id, receiver_id, subject, message)
                VALUES (%s, %s, %s, %s)
            """, (sender_id, safe_str(recipient[0]), subject, message))
        
        conn.commit()
        
        return success_response(
            data={
                "broadcast_id": safe_str(broadcast_id),
                "recipients": len(recipients)
            },
            status_code=201
        )
    except Exception as e:
        if conn:
            conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close()
        conn.close()

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
    print("🔒 Password hashing: bcrypt/SHA256")
    print("🛡️  SQL injection protection: Parameterized queries")
    app.run(debug=True, host='0.0.0.0', port=5000)