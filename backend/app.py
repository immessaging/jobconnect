from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import json
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection helper
def get_db_connection():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

# ============================================
# HOME ROUTE
# ============================================
@app.route('/')
def home():
    return jsonify({
        "app": "JobConnect Nigeria",
        "status": "Running",
        "version": "2.0.0",
        "database": "Connected"
    })

# ============================================
# JOB SEEKER ROUTES
# ============================================

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        conn = get_db_connection()
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
                "id": str(row[0]), "title": row[1], "qualification": row[2],
                "experience": row[3], "skills": row[4],
                "salary_min": float(row[5]) if row[5] else 0,
                "salary_max": float(row[6]) if row[6] else 0,
                "salary_type": row[7], "verified_badge": row[8], "status": row[9],
                "posted_date": str(row[10])
            })
        cur.close(); conn.close()
        return jsonify({"success": True, "jobs": jobs, "count": len(jobs)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_detail(job_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, job_title, qualification_requirements, experience_requirements,
                   required_skills, salary_range_min, salary_range_max, salary_type,
                   verification_badge, status, created_at
            FROM job_listings WHERE id = %s AND status = 'active'
        """, (job_id,))
        job = cur.fetchone()
        cur.close(); conn.close()
        if not job:
            return jsonify({"success": False, "error": "Job not found"}), 404
        return jsonify({"success": True, "job": {
            "id": str(job[0]), "title": job[1], "qualification": job[2],
            "experience": job[3], "skills": job[4],
            "salary_min": float(job[5]) if job[5] else 0,
            "salary_max": float(job[6]) if job[6] else 0,
            "salary_type": job[7], "verified_badge": job[8], "status": job[9],
            "posted_date": str(job[10])
        }})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================
# AGENT ROUTES
# ============================================

@app.route('/api/agent/<agent_id>/jobs', methods=['GET'])
def get_agent_jobs(agent_id):
    try:
        conn = get_db_connection()
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
                "id": str(row[0]), "title": row[1], "qualification": row[2],
                "experience": row[3], "skills": row[4],
                "salary_min": float(row[5]) if row[5] else 0,
                "salary_max": float(row[6]) if row[6] else 0,
                "salary_type": row[7], "organization": row[8],
                "contact_person": row[9], "contact_email": row[10],
                "contact_phone": row[11], "badge": row[12], "status": row[13],
                "created": str(row[14]), "applications": row[15]
            })
        cur.close(); conn.close()
        return jsonify({"success": True, "jobs": jobs, "count": len(jobs)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/agent/post-job', methods=['POST'])
def post_job():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
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
            data['agent_id'], data['job_title'], data['qualification_requirements'],
            data['experience_requirements'], data.get('required_skills', ''),
            data['salary_range_min'], data['salary_range_max'],
            data.get('salary_type', 'monthly'), data['organization_name'],
            data.get('organization_contact_person', ''), data.get('organization_email', ''),
            data.get('organization_phone', ''),
            data.get('commission_percentage', 15),
            data.get('is_negotiable', True),
            data.get('has_interview', False),
            data.get('has_exam', False)
        ))
        job_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Job posted", "job_id": str(job_id)}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# USER REGISTRATION
# ============================================
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        required = ['email', 'phone', 'password', 'user_type']
        for field in required:
            if field not in data:
                return jsonify({"success": False, "error": f"{field} is required"}), 400
        
        valid_types = ['agent', 'job_seeker']
        if data['user_type'] not in valid_types:
            return jsonify({"success": False, "error": "Invalid user type"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"success": False, "error": "Email already registered"}), 409
        
        cur.execute("SELECT id FROM users WHERE phone = %s", (data['phone'],))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"success": False, "error": "Phone already registered"}), 409
        
        cur.execute("""
            INSERT INTO users (email, phone, password_hash, user_type)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (data['email'], data['phone'], data['password'], data['user_type']))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        
        return jsonify({"success": True, "message": "Registration successful", "user_id": str(user_id)}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# TEST DATA ENDPOINT
# ============================================
@app.route('/api/test-data')
def test_data():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT id, email, user_type, is_verified FROM users')
        users = [{"id": str(u[0]), "email": u[1], "type": u[2], "verified": u[3]} for u in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({"success": True, "users": users, "total_users": len(users)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ============================================
# GET TESTIMONIALS
# ============================================
@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, role, company, text, rating, is_verified, created_at
            FROM testimonials WHERE is_active = TRUE ORDER BY created_at DESC
        """)
        testimonials = []
        for row in cur.fetchall():
            testimonials.append({
                "id": str(row[0]), "name": row[1], "role": row[2],
                "company": row[3], "text": row[4], "rating": row[5],
                "is_verified": row[6], "created_at": str(row[7])
            })
        cur.close(); conn.close()
        return jsonify({"success": True, "testimonials": testimonials})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# PLATFORM STATS FOR HOMEPAGE
# ============================================
@app.route('/api/stats', methods=['GET'])
def get_platform_stats():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        stats = {}
        
        # Active jobs count
        cur.execute("SELECT COUNT(*) FROM job_listings WHERE status = 'active'")
        stats['active_jobs'] = cur.fetchone()[0]
        
        # Filled/secured jobs
        cur.execute("SELECT COUNT(*) FROM job_listings WHERE status = 'filled'")
        stats['jobs_secured'] = cur.fetchone()[0]
        
        # Total users
        cur.execute("SELECT COUNT(*) FROM users")
        stats['total_users'] = cur.fetchone()[0]
        
        # Verified agents
        cur.execute("SELECT COUNT(*) FROM users WHERE user_type = 'agent' AND is_verified = true")
        stats['verified_agents'] = cur.fetchone()[0]
        
        # Total commission paid
        cur.execute("SELECT COALESCE(SUM(commission_amount), 0) FROM commission_agreements WHERE payment_status = 'paid'")
        stats['total_commission'] = float(cur.fetchone()[0])
        
        cur.close()
        conn.close()
        
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# CONTACT FORM ENDPOINT
# ============================================
@app.route('/api/contact', methods=['POST'])
def contact_form():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (data['name'], data['email'], data['subject'], data['message'],
              request.remote_addr, request.headers.get('User-Agent', '')))
        msg_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Message sent", "id": str(msg_id)}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# SUBMIT VERIFICATION DOCUMENTS
# ============================================
@app.route('/api/verify/submit', methods=['POST'])
def submit_verification():
    try:
        data = request.json
        user_id = data.get('user_id')
        user_type = data.get('user_type', 'job_seeker')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE users SET 
                verification_status = 'pending',
                nin = %s, bvn = %s, bank_name = %s, account_number = %s,
                address = COALESCE(%s, address),
                guarantor_name = %s, guarantor_phone = %s, guarantor_address = %s,
                next_of_kin_name = %s, next_of_kin_phone = %s, next_of_kin_address = %s,
                emergency_contact_name = %s, emergency_contact_phone = %s,
                social_media_1 = %s, social_media_2 = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (
            data.get('nin'), data.get('bvn'), data.get('bank_name'),
            data.get('account_number'), data.get('address'),
            data.get('guarantor_name'), data.get('guarantor_phone'),
            data.get('guarantor_address'), data.get('next_of_kin_name'),
            data.get('next_of_kin_phone'), data.get('next_of_kin_address'),
            data.get('emergency_contact_name'), data.get('emergency_contact_phone'),
            data.get('social_media_1'), data.get('social_media_2'), user_id
        ))
        
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, activity_type, 
                activity_description, module, severity, ip_address)
            VALUES (%s, %s, 'verification_submitted', %s, 'verification', 'info', %s)
        """, (user_id, data.get('email'), 
              f'{user_type} submitted verification documents', request.remote_addr))
        
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Verification documents submitted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# GPS LOCATION TRACKING
# ============================================
@app.route('/api/gps/track', methods=['POST'])
def track_gps_location():
    try:
        data = request.json
        user_id = data.get('user_id')
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO gps_locations (user_id, user_email, latitude, longitude, accuracy,
                city, state, country, location_string, ip_address, session_id, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, data.get('email'), data['latitude'], data['longitude'],
              data.get('accuracy'), data.get('city', ''), data.get('state', ''),
              data.get('country', 'Nigeria'), data.get('location_string', ''),
              request.remote_addr, data.get('session_id', ''),
              request.headers.get('User-Agent', '')))
        if user_id:
            cur.execute("""
                UPDATE users SET gps_latitude = %s, gps_longitude = %s,
                gps_accuracy = %s, last_location_update = NOW() WHERE id = %s
            """, (data['latitude'], data['longitude'], data.get('accuracy'), user_id))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Location tracked"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# ACCESS LOG
# ============================================
@app.route('/api/logs/access', methods=['POST'])
def log_access():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO access_logs (user_id, user_email, user_type, page_accessed,
                ip_address, user_agent, gps_latitude, gps_longitude, device_type, browser, os)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (data.get('user_id'), data.get('email'), data.get('user_type'),
              data.get('page'), request.remote_addr, request.headers.get('User-Agent', ''),
              data.get('latitude'), data.get('longitude'), data.get('device_type', ''),
              data.get('browser', ''), data.get('os', '')))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# ACTIVITY LOG
# ============================================
@app.route('/api/logs/activity', methods=['POST'])
def log_activity():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, user_type, activity_type,
                activity_description, module, severity, metadata, ip_address, gps_latitude, gps_longitude)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (data.get('user_id'), data.get('email'), data.get('user_type'),
              data.get('activity_type'), data.get('description'), data.get('module'),
              data.get('severity', 'info'), json.dumps(data.get('metadata', {})),
              request.remote_addr, data.get('latitude'), data.get('longitude')))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# NOTIFICATIONS
# ============================================
@app.route('/api/notifications/<user_id>', methods=['GET'])
def get_notifications(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, message, type, is_read, link, created_at
            FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
        notifications = [{"id": str(r[0]), "title": r[1], "message": r[2],
                          "type": r[3], "is_read": r[4], "link": r[5],
                          "created_at": str(r[6])} for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({"success": True, "notifications": notifications})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# ANNOUNCEMENTS
# ============================================
@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, content, priority, target_audience, created_at
            FROM announcements WHERE is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC
        """)
        announcements = [{"id": str(r[0]), "title": r[1], "content": r[2],
                          "priority": r[3], "audience": r[4], "date": str(r[5])}
                         for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({"success": True, "announcements": announcements})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# AGENT CONFIRM DISPUTE
# ============================================
@app.route('/api/commission/<agreement_id>/agent-confirm', methods=['POST'])
def agent_confirm_dispute(agreement_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE commission_agreements SET dispute_agent_confirmed = TRUE
            WHERE id = %s
        """, (agreement_id,))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Agent confirmed"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# ANALYTICS SUMMARY
# ============================================
@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        stats = {}
        cur.execute("SELECT COUNT(*) FROM users"); stats['total_users'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users WHERE user_type = 'agent'"); stats['total_agents'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users WHERE user_type = 'job_seeker'"); stats['total_seekers'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM job_listings WHERE status = 'active'"); stats['active_jobs'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM job_listings WHERE status = 'filled'"); stats['filled_jobs'] = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(commission_amount), 0) FROM commission_agreements WHERE payment_status = 'paid'")
        stats['total_commission'] = float(cur.fetchone()[0])
        cur.execute("SELECT COUNT(*) FROM users WHERE verification_status = 'pending'")
        stats['pending_verifications'] = cur.fetchone()[0]
        cur.close(); conn.close()
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# RUN APPLICATION
# ============================================
if __name__ == '__main__':
    print("🚀 JobConnect Nigeria API Starting...")
    print("📍 Local: http://localhost:5000")
    print("📊 Database: Connected")
    app.run(debug=True, host='0.0.0.0', port=5000)