from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import json
from dotenv import load_dotenv
from datetime import datetime
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection helper
def get_db_connection():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

# SendGrid Configuration
SENDGRID_API_KEY = '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'
FROM_EMAIL = 'noreply@jobconnect.ng'
FROM_NAME = 'JobConnect Nigeria'

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
# USER LOGIN
# ============================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, email, user_type, is_verified, password_hash
            FROM users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({"success": False, "error": "Invalid email or password"}), 401
        
        stored_password = user[4]
        
        # Try SHA256 first
        import hashlib
        input_hashed = hashlib.sha256(password.encode()).hexdigest()
        
        if input_hashed == stored_password:
            return jsonify({"success": True, "user": {"id": str(user[0]), "email": user[1], "user_type": user[2], "is_verified": user[3]}}), 200
        
        # Try bcrypt (for old passwords)
        try:
            import bcrypt
            if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
                return jsonify({"success": True, "user": {"id": str(user[0]), "email": user[1], "user_type": user[2], "is_verified": user[3]}}), 200
        except:
            pass
        
        # Try plain text (for old users)
        if password == stored_password:
            return jsonify({"success": True, "user": {"id": str(user[0]), "email": user[1], "user_type": user[2], "is_verified": user[3]}}), 200
        
        return jsonify({"success": False, "error": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
# ============================================
# USER REGISTRATION (with Welcome Email)
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
        
        # Hash the password
        import hashlib
        hashed = hashlib.sha256(data['password'].encode()).hexdigest()
        
        cur.execute("""
            INSERT INTO users (email, phone, password_hash, user_type)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (data['email'], data['phone'], hashed, data['user_type']))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        # Send welcome email
        try:
            sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
            from_email = Email(FROM_EMAIL, FROM_NAME)
            to_email = To(data['email'])
            content = Content("text/html", f'''
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#d4a843;">Welcome to JobConnect Nigeria!</h2>
                    <p>Thank you for registering!</p>
                    <p>Complete your profile to start finding verified jobs.</p>
                    <a href="https://jobconnect-sage.vercel.app/dashboard/seeker" 
                       style="background:#d42027;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:15px;">
                       Go to Dashboard
                    </a>
                </div>''')
            mail = Mail(from_email, to_email, "Welcome to JobConnect Nigeria!", content)
            sg.client.mail.send.post(request_body=mail.get())
        except:
            pass
        
        return jsonify({"success": True, "message": "Registration successful", "user_id": str(user_id)}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
        # Send welcome email
        try:
            sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
            from_email = Email(FROM_EMAIL, FROM_NAME)
            to_email = To(data['email'])
            content = Content("text/html", f'''
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#d4a843;">Welcome to JobConnect Nigeria!</h2>
                    <p>Thank you for registering!</p>
                    <p>Complete your profile to start finding verified jobs.</p>
                    <a href="https://jobconnect-sage.vercel.app/dashboard/seeker" 
                       style="background:#d42027;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:15px;">
                       Go to Dashboard
                    </a>
                </div>''')
            mail = Mail(from_email, to_email, "Welcome to JobConnect Nigeria!", content)
            sg.client.mail.send.post(request_body=mail.get())
        except:
            pass  # Don't fail registration if email fails
        
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
        cur.execute("SELECT COUNT(*) FROM job_listings WHERE status = 'active'")
        stats['active_jobs'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM job_listings WHERE status = 'filled'")
        stats['jobs_secured'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users")
        stats['total_users'] = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users WHERE user_type = 'agent' AND is_verified = true")
        stats['verified_agents'] = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(commission_amount), 0) FROM commission_agreements WHERE payment_status = 'paid'")
        stats['total_commission'] = float(cur.fetchone()[0])
        cur.close(); conn.close()
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
# SUBMIT VERIFICATION DOCUMENTS (All User Types)
# ============================================
@app.route('/api/verify/submit', methods=['POST'])
def submit_verification():
    try:
        data = request.json
        user_id = data.get('user_id')
        user_type = data.get('user_type', 'job_seeker')
        email = data.get('email', '')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update users table with common fields
        cur.execute("""
            UPDATE users SET 
                verification_status = 'pending',
                full_name = COALESCE(%s, full_name),
                date_of_birth = COALESCE(%s::date, date_of_birth),
                address = COALESCE(%s, address),
                city = COALESCE(%s, city),
                state = COALESCE(%s, state),
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
            data.get('account_number'), data.get('guarantor_name'),
            data.get('guarantor_phone'), data.get('guarantor_address'),
            data.get('next_of_kin_name'), data.get('next_of_kin_phone'),
            data.get('next_of_kin_address'), data.get('emergency_contact_name'),
            data.get('emergency_contact_phone'), data.get('social_media_1'),
            data.get('social_media_2'), user_id
        ))
        
        # Handle profile tables based on user type
        if user_type == 'job_seeker':
            cur.execute("SELECT id FROM job_seeker_profiles WHERE user_id = %s", (user_id,))
            profile = cur.fetchone()
            if profile:
                cur.execute("""
                    UPDATE job_seeker_profiles SET 
                        full_name = COALESCE(%s, full_name),
                        nin = COALESCE(%s, nin),
                        date_of_birth = COALESCE(%s::date, date_of_birth),
                        address = COALESCE(%s, address),
                        verification_status = 'pending'
                    WHERE user_id = %s
                """, (data.get('full_name'), data.get('nin'),
                      data.get('date_of_birth'), data.get('address'), user_id))
            else:
                cur.execute("""
                    INSERT INTO job_seeker_profiles 
                    (user_id, full_name, nin, date_of_birth, address, verification_status)
                    VALUES (%s, %s, %s, %s, %s, 'pending')
                """, (user_id, data.get('full_name', email), data.get('nin', 'PENDING'),
                      data.get('date_of_birth', '2000-01-01'), data.get('address', 'Address to be updated')))
        
        elif user_type == 'agent':
            cur.execute("SELECT id FROM agent_profiles WHERE user_id = %s", (user_id,))
            agent_profile = cur.fetchone()
            if agent_profile:
                cur.execute("""
                    UPDATE agent_profiles SET 
                        full_name = COALESCE(%s, full_name),
                        nin = COALESCE(%s, nin),
                        bvn = COALESCE(%s, bvn),
                        date_of_birth = COALESCE(%s::date, date_of_birth),
                        address = COALESCE(%s, address),
                        guarantor_name = COALESCE(%s, guarantor_name),
                        guarantor_phone = COALESCE(%s, guarantor_phone),
                        verification_status = 'pending'
                    WHERE user_id = %s
                """, (data.get('full_name'), data.get('nin'), data.get('bvn'),
                      data.get('date_of_birth'), data.get('address'),
                      data.get('guarantor_name'), data.get('guarantor_phone'), user_id))
            else:
                cur.execute("""
                    INSERT INTO agent_profiles 
                    (user_id, full_name, nin, bvn, date_of_birth, address,
                     guarantor_name, guarantor_phone, verification_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                """, (user_id, data.get('full_name', email), data.get('nin', 'PENDING'),
                      data.get('bvn', 'PENDING'), data.get('date_of_birth', '2000-01-01'),
                      data.get('address', 'Address to be updated'),
                      data.get('guarantor_name', ''), data.get('guarantor_phone', '')))
        
        # Log activity
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, activity_type, 
                activity_description, module, severity, ip_address)
            VALUES (%s, %s, 'verification_submitted', %s, 'verification', 'info', %s)
        """, (user_id, email, 
              f'{user_type} submitted verification documents', request.remote_addr))
        
        # Send verification email
        try:
            sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
            from_email = Email(FROM_EMAIL, FROM_NAME)
            to_email = To(email)
            content = Content("text/html", f'''
                <h2>Verification Submitted</h2>
                <p>Dear {data.get('full_name', 'User')},</p>
                <p>Your verification documents have been received (24-48 hour review).</p>
            ''')
            mail = Mail(from_email, to_email, "Verification Submitted - JobConnect Nigeria", content)
            sg.client.mail.send.post(request_body=mail.get())
        except:
            pass
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Verification documents submitted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# GPS LOCATION TRACKING - FULL
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
                altitude, speed, heading, city, state, country, location_string, 
                ip_address, session_id, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, data.get('email'), data['latitude'], data['longitude'],
            data.get('accuracy'), data.get('altitude'), data.get('speed'),
            data.get('heading'), data.get('city', ''), data.get('state', ''),
            data.get('country', 'Nigeria'), data.get('location_string', ''),
            request.remote_addr, data.get('session_id', ''),
            request.headers.get('User-Agent', '')
        ))
        location_id = cur.fetchone()[0]
        if user_id:
            cur.execute("""
                UPDATE users SET 
                    gps_latitude = %s, gps_longitude = %s,
                    gps_accuracy = %s, last_location_update = NOW(),
                    city = COALESCE(%s, city),
                    state = COALESCE(%s, state)
                WHERE id = %s
            """, (data['latitude'], data['longitude'], data.get('accuracy'),
                  data.get('city'), data.get('state'), user_id))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Location tracked", "id": str(location_id)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/gps/history/<user_id>', methods=['GET'])
def get_gps_history(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, latitude, longitude, accuracy, altitude, speed, 
                   city, state, country, location_string, created_at
            FROM gps_locations WHERE user_id = %s 
            ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
        locations = []
        for row in cur.fetchall():
            locations.append({
                "id": str(row[0]), "latitude": float(row[1]) if row[1] else None,
                "longitude": float(row[2]) if row[2] else None,
                "accuracy": float(row[3]) if row[3] else None,
                "altitude": float(row[4]) if row[4] else None,
                "speed": float(row[5]) if row[5] else None,
                "city": row[6], "state": row[7], "country": row[8],
                "location_string": row[9], "timestamp": str(row[10])
            })
        cur.close(); conn.close()
        return jsonify({"success": True, "locations": locations})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/gps/all-users', methods=['GET'])
def get_all_user_locations():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT ON (u.id) 
                u.id, u.email, u.user_type, u.gps_latitude, u.gps_longitude,
                u.gps_accuracy, u.city, u.state, u.last_location_update
            FROM users u WHERE u.gps_latitude IS NOT NULL
            ORDER BY u.id, u.last_location_update DESC
        """)
        users = []
        for row in cur.fetchall():
            users.append({
                "id": str(row[0]), "email": row[1], "type": row[2],
                "latitude": float(row[3]) if row[3] else None,
                "longitude": float(row[4]) if row[4] else None,
                "accuracy": float(row[5]) if row[5] else None,
                "city": row[6], "state": row[7],
                "last_update": str(row[8]) if row[8] else None
            })
        cur.close(); conn.close()
        return jsonify({"success": True, "users": users})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ============================================
# SENDGRID EMAIL NOTIFICATIONS
# ============================================
@app.route('/api/email/send', methods=['POST'])
def send_email():
    try:
        data = request.json
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        from_email = Email(FROM_EMAIL, FROM_NAME)
        to_email = To(data.get('to'))
        subject = data.get('subject')
        content = Content("text/html", data.get('body', ''))
        mail = Mail(from_email, to_email, subject, content)
        response = sg.client.mail.send.post(request_body=mail.get())
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO activity_logs (user_id, user_email, activity_type, 
                activity_description, module, severity, ip_address)
            VALUES (%s, %s, 'email_sent', %s, 'notifications', 'info', %s)
        """, (data.get('user_id'), data.get('to'),
              f"Email sent to {data.get('to')}: {subject}", request.remote_addr))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Email sent", "status_code": response.status_code}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/email/notify', methods=['POST'])
def send_notification_email():
    try:
        data = request.json
        email_type = data.get('type')
        recipient = data.get('to')
        user_name = data.get('name', 'User')
        templates = {
            'welcome': {
                'subject': 'Welcome to JobConnect Nigeria! 🇳🇬',
                'body': f'''<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#d4a843;">Welcome to JobConnect Nigeria, {user_name}!</h2>
                    <p>Thank you for joining Nigeria's most trusted job connection platform.</p>
                    <p>Complete your profile verification to access all features.</p>
                    <a href="https://jobconnect-sage.vercel.app" style="background:#d42027;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:15px;">Go to Dashboard</a>
                </div>'''
            },
            'payment': {
                'subject': 'Payment Confirmed - JobConnect Nigeria',
                'body': f'''<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#28a745;">✅ Payment Confirmed!</h2>
                    <p>Dear {user_name},</p>
                    <p>Your commission payment of <strong>₦{data.get('amount', 0):,}</strong> has been received and is securely held in escrow.</p>
                    <p><strong>Reference:</strong> {data.get('reference', 'N/A')}</p>
                </div>'''
            },
            'verification': {
                'subject': 'Verification Update - JobConnect Nigeria',
                'body': f'''<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#d4a843;">Verification Update</h2>
                    <p>Dear {user_name},</p>
                    <p>Your verification documents have been received and are under review (24-48 hours).</p>
                </div>'''
            },
            'dispute': {
                'subject': 'Dispute Update - JobConnect Nigeria',
                'body': f'''<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#d42027;">Dispute Update</h2>
                    <p>Dear {user_name},</p>
                    <p>Status: {data.get('status', 'Under Review')}</p>
                </div>'''
            }
        }
        template = templates.get(email_type, templates['welcome'])
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        from_email = Email(FROM_EMAIL, FROM_NAME)
        to_email = To(recipient)
        content = Content("text/html", template['body'])
        mail = Mail(from_email, to_email, template['subject'], content)
        response = sg.client.mail.send.post(request_body=mail.get())
        return jsonify({"success": True, "message": "Notification sent"}), 200
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
# ADMIN: GET ALL VERIFICATION DOCUMENTS
# ============================================
@app.route('/api/admin/verifications', methods=['GET'])
def get_all_verifications():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT u.id, u.email, u.user_type, u.full_name, u.verification_status,
                   u.passport_photo, u.nin, u.bvn, u.bank_name, u.account_number,
                   u.date_of_birth, u.address, u.city, u.state,
                   u.guarantor_name, u.guarantor_phone,
                   u.next_of_kin_name, u.next_of_kin_phone,
                   u.emergency_contact_name, u.emergency_contact_phone,
                   u.social_media_1, u.social_media_2,
                   u.created_at, u.updated_at
            FROM users u
            WHERE u.verification_status = 'pending'
            ORDER BY u.created_at DESC
        """)
        
        users = []
        for row in cur.fetchall():
            users.append({
                "id": str(row[0]), "email": row[1], "user_type": row[2],
                "full_name": row[3], "verification_status": row[4],
                "passport_photo": row[5], "nin": row[6], "bvn": row[7],
                "bank_name": row[8], "account_number": row[9],
                "date_of_birth": str(row[10]) if row[10] else None,
                "address": row[11], "city": row[12], "state": row[13],
                "guarantor_name": row[14], "guarantor_phone": row[15],
                "next_of_kin_name": row[16], "next_of_kin_phone": row[17],
                "emergency_contact_name": row[18], "emergency_contact_phone": row[19],
                "social_media_1": row[20], "social_media_2": row[21],
                "created_at": str(row[22]), "updated_at": str(row[23])
            })
        
        cur.close(); conn.close()
        return jsonify({"success": True, "users": users, "count": len(users)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/admin/verify/<user_id>', methods=['POST'])
def verify_user(user_id):
    """Approve or reject user verification"""
    try:
        data = request.json
        action = data.get('action')  # 'approve' or 'reject'
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if action == 'approve':
            cur.execute("""
                UPDATE users SET is_verified = true, verification_status = 'verified',
                verification_level = 1, updated_at = NOW()
                WHERE id = %s
            """, (user_id,))
        else:
            cur.execute("""
                UPDATE users SET verification_status = 'rejected', updated_at = NOW()
                WHERE id = %s
            """, (user_id,))
        
        conn.commit()
        cur.close(); conn.close()
        
        return jsonify({"success": True, "message": f"User {action}d successfully"}), 200
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