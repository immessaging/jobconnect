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

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://jobconnect-sage.vercel.app", "http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-Data", "X-Admin-Id"],
        "supports_credentials": True
    }
})

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'https://jobconnect-sage.vercel.app'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Data, X-Admin-Id'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

limiter = Limiter(app=app, key_func=get_remote_address, default_limits=["200 per day", "50 per hour"], storage_uri="memory://")

def get_db_connection():
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url: raise ValueError("DATABASE_URL not configured")
        return psycopg2.connect(database_url)
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@jobconnect.ng')
FROM_NAME = 'JobConnect Nigeria'
PASSWORD_SALT_ROUNDS = 12

def hash_password(password):
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(PASSWORD_SALT_ROUNDS)).decode('utf-8')
    except:
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, stored_hash):
    if not password or not stored_hash: return False
    if stored_hash.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        except: pass
    if len(stored_hash) == 64:
        try:
            if hashlib.sha256(password.encode()).hexdigest() == stored_hash: return True
        except: pass
    if password == stored_hash: return True
    return False

def success_response(data=None, message=None, status_code=200):
    response = {"success": True}
    if data is not None: response["data"] = data
    if message: response["message"] = message
    return jsonify(response), status_code

def error_response(error, status_code=400, data=None):
    response = {"success": False, "error": error, "code": status_code}
    if data: response["data"] = data
    return jsonify(response), status_code

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_data = request.headers.get('X-User-Data')
        if not admin_data: return error_response("Authorization required", 401)
        try:
            user = json.loads(admin_data)
            if user.get('adminLevel') in ['admin', 'admin2', 'admin1', 'admin2_70']: return f(*args, **kwargs)
        except: pass
        return error_response("Admin access required", 403)
    return decorated_function

def safe_str(value): return str(value) if value is not None else None
def safe_float(value): return float(value) if value is not None else 0.0
def safe_int(value): return int(value) if value is not None else 0

# HOME
@app.route('/')
def home():
    return success_response(data={"app": "JobConnect Nigeria", "status": "Running", "version": "2.1.0", "database": "Connected"})

# JOBS
@app.route('/api/jobs', methods=['GET'])
@limiter.limit("30 per minute")
def get_jobs():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, job_title, qualification_requirements, experience_requirements, required_skills, salary_range_min, salary_range_max, salary_type, verification_badge, status, created_at FROM job_listings WHERE status = 'active' ORDER BY created_at DESC")
        jobs = [{"id": safe_str(r[0]), "title": r[1], "qualification": r[2], "experience": r[3], "skills": r[4], "salary_min": safe_float(r[5]), "salary_max": safe_float(r[6]), "salary_type": r[7], "verified_badge": r[8], "status": r[9], "posted_date": safe_str(r[10])} for r in cur.fetchall()]
        return success_response(data={"jobs": jobs, "count": len(jobs)})
    except Exception as e: return error_response(str(e), 500)
    finally: cur.close(); conn.close()

@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_detail(job_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, job_title, qualification_requirements, experience_requirements, required_skills, salary_range_min, salary_range_max, salary_type, verification_badge, status, created_at FROM job_listings WHERE id = %s AND status = 'active'", (job_id,))
        job = cur.fetchone()
        if not job: return error_response("Job not found", 404)
        return success_response(data={"job": {"id": safe_str(job[0]), "title": job[1], "qualification": job[2], "experience": job[3], "skills": job[4], "salary_min": safe_float(job[5]), "salary_max": safe_float(job[6]), "salary_type": job[7], "verified_badge": job[8], "status": job[9], "posted_date": safe_str(job[10])}})
    except Exception as e: return error_response(str(e), 500)
    finally: cur.close(); conn.close()

# AGENT
@app.route('/api/agent/<agent_id>/jobs', methods=['GET'])
def get_agent_jobs(agent_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT j.id, j.job_title, j.qualification_requirements, j.experience_requirements, j.required_skills, j.salary_range_min, j.salary_range_max, j.salary_type, j.organization_name, j.organization_contact_person, j.organization_email, j.organization_phone, j.verification_badge, j.status, j.created_at, COUNT(ca.id) as applications FROM job_listings j LEFT JOIN commission_agreements ca ON j.id = ca.job_id WHERE j.agent_id = %s GROUP BY j.id ORDER BY j.created_at DESC", (agent_id,))
        jobs = [{"id": safe_str(r[0]), "title": r[1], "qualification": r[2], "experience": r[3], "skills": r[4], "salary_min": safe_float(r[5]), "salary_max": safe_float(r[6]), "salary_type": r[7], "organization": r[8], "contact_person": r[9], "contact_email": r[10], "contact_phone": r[11], "badge": r[12], "status": r[13], "created": safe_str(r[14]), "applications": safe_int(r[15])} for r in cur.fetchall()]
        return success_response(data={"jobs": jobs, "count": len(jobs)})
    except Exception as e: return error_response(str(e), 500)
    finally: cur.close(); conn.close()

@app.route('/api/agent/post-job', methods=['POST'])
@limiter.limit("10 per hour")
def post_job_with_kyc():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        agent_id = data.get('agent_id')
        if not agent_id: return error_response("Agent ID is required", 400)
        cur = conn.cursor()
        cur.execute("SELECT kyc_status, bvn_verified, nin_verified, is_verified, verification_status FROM users WHERE id = %s", (agent_id,))
        user = cur.fetchone()
        if not user: return error_response("User not found", 404)
        if not (user[3] or user[0] == 'approved' or user[4] == 'verified'):
            return error_response("Complete verification before posting jobs.", 403, data={"kyc_required": True})
        cur.execute("INSERT INTO job_listings (agent_id, job_title, qualification_requirements, experience_requirements, required_skills, salary_range_min, salary_range_max, salary_type, organization_name, organization_contact_person, organization_email, organization_phone, commission_percentage, is_negotiable, has_interview, has_exam, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active') RETURNING id",
            (agent_id, data['job_title'], data['qualification_requirements'], data['experience_requirements'], data.get('required_skills', ''), data['salary_range_min'], data['salary_range_max'], data.get('salary_type', 'monthly'), data['organization_name'], data.get('organization_contact_person', ''), data.get('organization_email', ''), data.get('organization_phone', ''), data.get('commission_percentage', 15), data.get('is_negotiable', True), data.get('has_interview', False), data.get('has_exam', False)))
        job_id = cur.fetchone()[0]
        conn.commit()
        return success_response(data={"job_id": safe_str(job_id)}, message="Job posted successfully", status_code=201)
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

# AUTH
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        if not email or not password: return error_response("Email and password required", 400)
        cur = conn.cursor()
        cur.execute("SELECT id, email, user_type, is_verified, password_hash, verification_status FROM users WHERE LOWER(email) = %s", (email,))
        user = cur.fetchone()
        if not user: return error_response("Invalid email or password", 401)
        if not verify_password(password, user[4]): return error_response("Invalid email or password", 401)
        if password == user[4] or (not user[4].startswith('$2b$') and len(user[4]) != 64):
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashlib.sha256(password.encode()).hexdigest(), str(user[0])))
            conn.commit()
        cur.execute("INSERT INTO access_logs (user_id, user_email, user_type, page_accessed, ip_address, user_agent) VALUES (%s, %s, %s, %s, %s, %s)", (str(user[0]), user[1], user[2], '/login', request.remote_addr, request.headers.get('User-Agent', '')))
        conn.commit()
        return success_response(data={"user": {"id": str(user[0]), "email": user[1], "user_type": user[2], "is_verified": user[3], "verification_status": user[5]}})
    except Exception as e: return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        email = data.get('email', '')
        phone = data.get('phone', '')
        password = data.get('password', '')
        user_type = data.get('user_type', 'job_seeker')
        if not email or not phone or not password: return error_response("All fields required", 400)
        if len(password) < 6: return error_response("Password must be at least 6 characters", 400)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s OR phone = %s", (email, phone))
        if cur.fetchone(): return error_response("Email or phone already registered", 409)
        cur.execute("INSERT INTO users (email, phone, password_hash, user_type) VALUES (%s, %s, %s, %s) RETURNING id", (email, phone, hash_password(password), user_type))
        user_id = cur.fetchone()[0]
        conn.commit()
        return success_response(data={"user_id": safe_str(user_id)}, message="Registration successful", status_code=201)
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

@app.route('/api/auth/reset-password', methods=['POST'])
@limiter.limit("3 per hour")
def reset_password():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        new_password = data.get('new_password', '')
        if not email or not new_password: return error_response("Email and new password required", 400)
        if len(new_password) < 6: return error_response("Password must be at least 6 characters", 400)
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE LOWER(email) = %s", (email,))
        user = cur.fetchone()
        if not user: return error_response("No account found", 404)
        cur.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", (hashlib.sha256(new_password.encode()).hexdigest(), str(user[0])))
        conn.commit()
        return success_response(message="Password reset successfully!")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

# STATS, TESTIMONIALS, ANALYTICS, ANNOUNCEMENTS
@app.route('/api/stats', methods=['GET'])
def get_platform_stats():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        stats = {}
        for key, q in [('active_jobs', "SELECT COUNT(*) FROM job_listings WHERE status = 'active'"), ('jobs_secured', "SELECT COUNT(*) FROM job_listings WHERE status = 'filled'"), ('total_users', "SELECT COUNT(*) FROM users"), ('verified_agents', "SELECT COUNT(*) FROM users WHERE user_type = 'agent' AND is_verified = true"), ('total_commission', "SELECT COALESCE(SUM(commission_amount), 0) FROM commission_agreements WHERE payment_status = 'paid'")]:
            cur.execute(q)
            stats[key] = safe_float(cur.fetchone()[0]) if key == 'total_commission' else safe_int(cur.fetchone()[0])
        return success_response(data={"stats": stats})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, role, company, text, rating, is_verified, created_at FROM testimonials WHERE is_active = TRUE ORDER BY created_at DESC")
        testimonials = [{"id": safe_str(r[0]), "name": r[1], "role": r[2], "company": r[3], "text": r[4], "rating": safe_int(r[5]), "is_verified": r[6], "created_at": safe_str(r[7])} for r in cur.fetchall()]
        return success_response(data={"testimonials": testimonials})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        stats = {}
        for key, q in [('total_users', "SELECT COUNT(*) FROM users"), ('total_agents', "SELECT COUNT(*) FROM users WHERE user_type = 'agent'"), ('total_seekers', "SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker'"), ('active_jobs', "SELECT COUNT(*) FROM job_listings WHERE status = 'active'"), ('filled_jobs', "SELECT COUNT(*) FROM job_listings WHERE status = 'filled'"), ('pending_verifications', "SELECT COUNT(*) FROM users WHERE verification_status = 'pending'")]:
            cur.execute(q)
            stats[key] = safe_int(cur.fetchone()[0])
        return success_response(data={"stats": stats})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, title, content, priority, target_audience, created_at FROM announcements WHERE is_active = TRUE ORDER BY created_at DESC")
        announcements = [{"id": safe_str(r[0]), "title": r[1], "content": r[2], "priority": r[3], "audience": r[4], "date": safe_str(r[5])} for r in cur.fetchall()]
        return success_response(data={"announcements": announcements})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/test-data')
def test_data():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute('SELECT id, email, user_type, is_verified FROM users')
        users = [{"id": safe_str(u[0]), "email": u[1], "type": u[2], "verified": u[3]} for u in cur.fetchall()]
        return success_response(data={"users": users, "total_users": len(users)})
    except Exception as e: return error_response(str(e), 500)
    finally: cur.close(); conn.close()

@app.route('/api/users-list', methods=['GET'])
def get_users_list():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, email, user_type, phone, is_verified FROM users ORDER BY created_at DESC")
        users = [{"id": safe_str(r[0]), "email": r[1], "user_type": r[2], "phone": r[3], "is_verified": r[4]} for r in cur.fetchall()]
        return success_response(data={"users": users})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

# VERIFICATION
@app.route('/api/verify/submit', methods=['POST'])
@limiter.limit("5 per day")
def submit_verification():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        user_id = data.get('user_id')
        user_type = data.get('user_type', 'job_seeker')
        if not user_id: return error_response("User ID is required", 400)
        cur = conn.cursor()
        if user_type == 'job_seeker':
            cur.execute("UPDATE users SET verification_status = 'pending', full_name = COALESCE(%s, full_name), date_of_birth = COALESCE(%s::date, date_of_birth), address = COALESCE(%s, address), nin = COALESCE(%s, nin), next_of_kin_name = COALESCE(%s, next_of_kin_name), next_of_kin_phone = COALESCE(%s, next_of_kin_phone), emergency_contact_name = COALESCE(%s, emergency_contact_name), emergency_contact_phone = COALESCE(%s, emergency_contact_phone), social_media_1 = COALESCE(%s, social_media_1), social_media_2 = COALESCE(%s, social_media_2), updated_at = NOW() WHERE id = %s", (data.get('full_name'), data.get('date_of_birth'), data.get('address'), data.get('nin'), data.get('next_of_kin_name'), data.get('next_of_kin_phone'), data.get('emergency_contact_name'), data.get('emergency_contact_phone'), data.get('social_media_1'), data.get('social_media_2'), user_id))
        else:
            cur.execute("UPDATE users SET verification_status = 'pending', full_name = COALESCE(%s, full_name), date_of_birth = COALESCE(%s::date, date_of_birth), address = COALESCE(%s, address), nin = COALESCE(%s, nin), bvn = COALESCE(%s, bvn), bank_name = COALESCE(%s, bank_name), account_number = COALESCE(%s, account_number), guarantor_name = COALESCE(%s, guarantor_name), guarantor_phone = COALESCE(%s, guarantor_phone), next_of_kin_name = COALESCE(%s, next_of_kin_name), next_of_kin_phone = COALESCE(%s, next_of_kin_phone), emergency_contact_name = COALESCE(%s, emergency_contact_name), emergency_contact_phone = COALESCE(%s, emergency_contact_phone), social_media_1 = COALESCE(%s, social_media_1), social_media_2 = COALESCE(%s, social_media_2), updated_at = NOW() WHERE id = %s", (data.get('full_name'), data.get('date_of_birth'), data.get('address'), data.get('nin'), data.get('bvn'), data.get('bank_name'), data.get('account_number'), data.get('guarantor_name'), data.get('guarantor_phone'), data.get('next_of_kin_name'), data.get('next_of_kin_phone'), data.get('emergency_contact_name'), data.get('emergency_contact_phone'), data.get('social_media_1'), data.get('social_media_2'), user_id))
        conn.commit()
        return success_response(message="Verification submitted successfully!")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()

@app.route('/api/user/profile/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user: return error_response("User not found", 404)
        columns = [desc[0] for desc in cur.description]
        return success_response(data={"profile": {col: safe_str(user[i]) for i, col in enumerate(columns)}})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/contact', methods=['POST'])
@limiter.limit("3 per hour")
def contact_form():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        for f in ['name', 'email', 'subject', 'message']:
            if not data.get(f): return error_response(f"{f} is required", 400)
        cur = conn.cursor()
        cur.execute("INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id", (data['name'], data['email'], data['subject'], data['message'], request.remote_addr, request.headers.get('User-Agent', '')))
        conn.commit()
        return success_response(data={"id": safe_str(cur.fetchone()[0])}, message="Message sent", status_code=201)
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally: cur.close(); conn.close()

# ADMIN
@app.route('/api/admin/users', methods=['GET'])
@require_admin
def admin_get_all_users():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, email, phone, user_type, is_verified, verification_status, full_name, created_at FROM users ORDER BY created_at DESC")
        users = [{"id": safe_str(r[0]), "email": r[1], "phone": r[2], "type": r[3], "verified": r[4], "verification_status": r[5], "full_name": r[6], "created_at": safe_str(r[7])} for r in cur.fetchall()]
        return success_response(data={"users": users, "count": len(users)})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/verifications', methods=['GET'])
@require_admin
def get_all_verifications():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, email, user_type, full_name, verification_status, nin, bvn, bank_name, account_number, address, created_at FROM users WHERE verification_status = 'pending' ORDER BY created_at DESC")
        users = [{"id": safe_str(r[0]), "email": r[1], "user_type": r[2], "full_name": r[3], "verification_status": r[4], "nin": r[5], "bvn": r[6], "bank_name": r[7], "account_number": r[8], "address": r[9], "created_at": safe_str(r[10])} for r in cur.fetchall()]
        return success_response(data={"users": users, "count": len(users)})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/verify/<user_id>', methods=['POST'])
@require_admin
def verify_user(user_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        action = data.get('action')
        if action not in ['approve', 'reject']: return error_response("Action must be 'approve' or 'reject'", 400)
        cur = conn.cursor()
        if action == 'approve': cur.execute("UPDATE users SET is_verified = true, verification_status = 'verified', updated_at = NOW() WHERE id = %s", (user_id,))
        else: cur.execute("UPDATE users SET verification_status = 'rejected', updated_at = NOW() WHERE id = %s", (user_id,))
        conn.commit()
        return success_response(message=f"User {action}d successfully")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/user/<user_id>', methods=['GET', 'PUT', 'DELETE'])
@require_admin
def admin_manage_user(user_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        if request.method == 'GET':
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user: return error_response("User not found", 404)
            columns = [desc[0] for desc in cur.description]
            return success_response(data={"user": {col: safe_str(user[i]) for i, col in enumerate(columns)}})
        elif request.method == 'PUT':
            data = request.json
            cur.execute("UPDATE users SET full_name = COALESCE(%s, full_name), email = COALESCE(%s, email), phone = COALESCE(%s, phone), is_verified = COALESCE(%s, is_verified), verification_status = COALESCE(%s, verification_status), updated_at = NOW() WHERE id = %s", (data.get('full_name'), data.get('email'), data.get('phone'), data.get('is_verified'), data.get('verification_status'), user_id))
            conn.commit()
            return success_response(message="User updated")
        elif request.method == 'DELETE':
            cur.execute("UPDATE users SET verification_status = 'deactivated', updated_at = NOW() WHERE id = %s", (user_id,))
            conn.commit()
            return success_response(message="User deactivated")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/user/<user_id>/toggle-status', methods=['POST'])
@require_admin
def admin_toggle_user_status(user_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET verification_status = CASE WHEN verification_status = 'blocked' THEN 'verified' ELSE 'blocked' END, updated_at = NOW() WHERE id = %s RETURNING verification_status", (user_id,))
        result = cur.fetchone()
        if not result: return error_response("User not found", 404)
        conn.commit()
        return success_response(data={"new_status": result[0]}, message=f"Status changed to {result[0]}")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/user/<user_id>/reset-password', methods=['POST'])
@require_admin
def admin_reset_password(user_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        new_password = data.get('new_password')
        if not new_password or len(new_password) < 6: return error_response("Password must be at least 6 characters", 400)
        cur = conn.cursor()
        cur.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", (hashlib.sha256(new_password.encode()).hexdigest(), user_id))
        conn.commit()
        return success_response(message="Password reset successfully")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally: cur.close(); conn.close()

# ADMIN LOGS
@app.route('/api/admin/access-logs', methods=['GET'])
@require_admin
def admin_get_access_logs():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM access_logs ORDER BY created_at DESC LIMIT 100")
        columns = [desc[0] for desc in cur.description]
        return success_response(data={"logs": [{col: safe_str(row[i]) for i, col in enumerate(columns)} for row in cur.fetchall()]})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/activity-logs', methods=['GET'])
@require_admin
def admin_get_activity_logs():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100")
        columns = [desc[0] for desc in cur.description]
        return success_response(data={"logs": [{col: safe_str(row[i]) for i, col in enumerate(columns)} for row in cur.fetchall()]})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()

@app.route('/api/admin/audit-logs', methods=['GET'])
@require_admin
def admin_get_audit_logs():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100")
        columns = [desc[0] for desc in cur.description]
        return success_response(data={"logs": [{col: safe_str(row[i]) for i, col in enumerate(columns)} for row in cur.fetchall()]})
    except Exception as e: return error_response(str(e), 400)
    finally: cur.close(); conn.close()
# =====================================================
# VERIFICATION DOCUMENTS
# =====================================================

@app.route('/api/verify/upload-document', methods=['POST'])
@limiter.limit("10 per hour")
def upload_verification_document():
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data = request.json
        user_id       = data.get('user_id')
        document_type = data.get('document_type')
        document_url  = data.get('document_url')

        if not user_id or not document_type or not document_url:
            return error_response("user_id, document_type and document_url are required", 400)

        allowed = ['utility_bill', 'bank_statement', 'voters_card', 'nin_slip']
        if document_type not in allowed:
            return error_response(f"document_type must be one of: {', '.join(allowed)}", 400)

        cur = conn.cursor()

        # Get user email for convenience
        cur.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            return error_response("User not found", 404)
        user_email = row[0]

        cur.execute("""
            INSERT INTO verification_documents
              (user_id, user_email, document_type, document_url, document_name, user_notes, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id, submitted_at
        """, (
            user_id, user_email, document_type, document_url,
            data.get('document_name'), data.get('user_notes')
        ))
        doc = cur.fetchone()

        # Mark the user as pending so they show up in the admin queue
        cur.execute("""
            UPDATE users
               SET verification_status = 'pending', updated_at = NOW()
             WHERE id = %s AND (verification_status IS NULL OR verification_status NOT IN ('verified'))
        """, (user_id,))

        conn.commit()
        return success_response(
            data={"document_id": safe_str(doc[0]), "submitted_at": safe_str(doc[1])},
            message="Document submitted for review",
            status_code=201
        )
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        if 'cur' in locals(): cur.close()
        conn.close()


@app.route('/api/verify/my-documents/<user_id>', methods=['GET'])
def get_my_verification_documents(user_id):
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, document_type, document_url, document_name,
                   user_notes, status, review_notes, submitted_at, reviewed_at
              FROM verification_documents
             WHERE user_id = %s
             ORDER BY submitted_at DESC
        """, (user_id,))
        docs = [{
            "id": safe_str(r[0]),
            "document_type": r[1],
            "document_url": r[2],
            "document_name": r[3],
            "user_notes": r[4],
            "status": r[5],
            "review_notes": r[6],
            "submitted_at": safe_str(r[7]),
            "reviewed_at": safe_str(r[8])
        } for r in cur.fetchall()]
        return success_response(data={"documents": docs})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close(); conn.close()


@app.route('/api/admin/verification-documents', methods=['GET'])
@require_admin
def admin_list_verification_documents():
    """Returns pending docs grouped by user — what the admin reviews."""
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        status = request.args.get('status', 'pending')

        cur = conn.cursor()
        cur.execute("""
            SELECT d.id, d.user_id, d.user_email, d.document_type, d.document_url,
                   d.document_name, d.user_notes, d.submitted_at,
                   u.user_type, u.full_name, u.phone
              FROM verification_documents d
              JOIN users u ON u.id = d.user_id
             WHERE d.status = %s
             ORDER BY d.submitted_at DESC
        """, (status,))

        by_user = {}
        for r in cur.fetchall():
            uid = safe_str(r[1])
            if uid not in by_user:
                by_user[uid] = {
                    "user_id": uid,
                    "email": r[2],
                    "user_type": r[8],
                    "full_name": r[9],
                    "phone": r[10],
                    "documents": []
                }
            by_user[uid]["documents"].append({
                "id": safe_str(r[0]),
                "document_type": r[3],
                "document_url": r[4],
                "document_name": r[5],
                "user_notes": r[6],
                "submitted_at": safe_str(r[7])
            })

        users = list(by_user.values())
        return success_response(data={"users": users, "count": len(users)})
    except Exception as e:
        return error_response(str(e), 400)
    finally:
        cur.close(); conn.close()


@app.route('/api/admin/verification-documents/<doc_id>/review', methods=['POST'])
@require_admin
def admin_review_document(doc_id):
    """Approve or reject a single document."""
    conn = get_db_connection()
    if not conn: return error_response("Database connection failed", 500)
    try:
        data   = request.json
        action = data.get('action')  # 'approve' | 'reject'
        if action not in ['approve', 'reject']:
            return error_response("Action must be 'approve' or 'reject'", 400)

        admin_data = json.loads(request.headers.get('X-User-Data', '{}'))
        admin_email = admin_data.get('email', 'admin')

        new_status = 'approved' if action == 'approve' else 'rejected'

        cur = conn.cursor()
        cur.execute("""
            UPDATE verification_documents
               SET status = %s, reviewed_by = %s, review_notes = %s, reviewed_at = NOW()
             WHERE id = %s
             RETURNING user_id
        """, (new_status, admin_email, data.get('review_notes'), doc_id))
        row = cur.fetchone()
        if not row:
            return error_response("Document not found", 404)
        user_id = row[0]

        # If ALL of this user's documents are approved → mark user verified
        cur.execute("""
            SELECT COUNT(*) FILTER (WHERE status = 'pending'),
                   COUNT(*) FILTER (WHERE status = 'rejected'),
                   COUNT(*) FILTER (WHERE status = 'approved')
              FROM verification_documents
             WHERE user_id = %s
        """, (user_id,))
        pending, rejected, approved = cur.fetchone()

        if action == 'approve' and pending == 0 and rejected == 0 and approved > 0:
            cur.execute("""
                UPDATE users
                   SET is_verified = TRUE, verification_status = 'verified', updated_at = NOW()
                 WHERE id = %s
            """, (user_id,))
        elif action == 'reject':
            cur.execute("""
                UPDATE users
                   SET verification_status = 'rejected', updated_at = NOW()
                 WHERE id = %s
            """, (user_id,))

        conn.commit()
        return success_response(message=f"Document {new_status}")
    except Exception as e:
        if conn: conn.rollback()
        return error_response(str(e), 400)
    finally:
        cur.close(); conn.close()
# ERROR HANDLERS
@app.errorhandler(404)
def not_found_error(error): return error_response("Endpoint not found", 404)

@app.errorhandler(500)
def internal_error(error): return error_response("Internal server error", 500)

@app.errorhandler(429)
def ratelimit_error(error): return error_response("Rate limit exceeded", 429)

# RUN
if __name__ == '__main__':
    print("🚀 JobConnect Nigeria API Starting...")
    print(f"📊 Database: {'Connected' if get_db_connection() else 'Not Connected'}")
    app.run(debug=True, host='0.0.0.0', port=5000)