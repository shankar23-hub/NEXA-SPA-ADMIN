import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from config   import Config
from database import safe_init_db, get_db, get_next_id, get_db_init_error
from routes.employee_routes      import employee_bp
from routes.project_routes       import project_bp
from routes.allocation_routes    import allocation_bp
from routes.certification_routes import cert_bp
from routes.staffid_routes       import staffid_bp
from routes.notification_routes  import notification_bp

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

SKILL_KEYWORDS = [
    "Python","JavaScript","TypeScript","React","Vue","Angular","Node.js","Express",
    "Django","Flask","FastAPI","SQL","PostgreSQL","MySQL","MongoDB","Redis","SQLite",
    "Docker","Kubernetes","AWS","Azure","GCP","Terraform","Jenkins","CI/CD","Git",
    "Linux","REST API","GraphQL","Agile","Scrum","Figma","Java","C++","Go","Rust",
    "Machine Learning","TensorFlow","PyTorch","Pandas","Scikit-learn","Numpy",
    "HTML5","CSS3","Tailwind","Bootstrap","Spring Boot","Cybersecurity","DevOps",
    "Data Science","AI","ML","NLP","LLM","OpenAI","Kafka","RabbitMQ","Elasticsearch",
]


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"]         = Config.SECRET_KEY
    app.config["JWT_SECRET_KEY"]     = Config.JWT_SECRET_KEY
    app.config["DEBUG"]              = Config.DEBUG
    app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB (for PDF uploads)

    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        os.environ.get("FRONTEND_URL", "").strip(),
    ]
    allowed_origins = [origin for origin in allowed_origins if origin]

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True
    )

    JWTManager(app)

    with app.app_context():
        db_ready, db_error = safe_init_db()
        app.config["DB_READY"] = db_ready
        app.config["DB_INIT_ERROR"] = db_error

    # ── Admin Auth: Login ─────────────────────────────────────────────────────
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data     = request.get_json() or {}
        email    = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        db   = get_db()
        user = db.users.find_one({"email": email}, {"_id": 0})
        if user:
            if not check_password_hash(user["passwordHash"], password):
                return jsonify({"message": "Invalid email or password"}), 401
            token = create_access_token(identity=email)
            return jsonify({"token": token, "user": {
                "id": user["id"], "name": user["name"],
                "email": user["email"], "role": user.get("role","Administrator"),
                "dept": user.get("dept","Management"),
            }})
        # Demo fallback
        token = create_access_token(identity=email)
        return jsonify({"token": token, "user": {
            "id": 0, "name": "Admin User", "email": email,
            "role": "Administrator", "dept": "Management",
        }})

    # ── Admin Auth: Register ──────────────────────────────────────────────────
    @app.route("/api/auth/register", methods=["POST"])
    def register():
        data     = request.get_json() or {}
        name     = (data.get("name") or "").strip()
        email    = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        role     = data.get("role","Administrator")
        dept     = data.get("dept","Management")
        if not name or not email or not password:
            return jsonify({"message": "name, email, and password are required"}), 400
        if len(password) < 6:
            return jsonify({"message": "Password must be at least 6 characters"}), 400
        db = get_db()
        if db.users.find_one({"email": email}):
            return jsonify({"message": "An account with this email already exists"}), 409
        new_id = get_next_id("users")
        user_doc = {"id": new_id, "name": name, "email": email,
                    "passwordHash": generate_password_hash(password),
                    "role": role, "dept": dept}
        db.users.insert_one(user_doc)
        token = create_access_token(identity=email)
        return jsonify({"token": token, "user": {"id": new_id, "name": name,
                        "email": email, "role": role, "dept": dept}}), 201

    # ── Admin Auth: Me ────────────────────────────────────────────────────────
    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def me():
        email = get_jwt_identity()
        db    = get_db()
        user  = db.users.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
        if user:
            return jsonify(user)
        return jsonify({"id": 0, "name": "Admin User", "email": email,
                        "role": "Administrator", "dept": "Management"})

    # ── Employee Portal Auth: Login ───────────────────────────────────────────
    @app.route("/api/employee/auth/login", methods=["POST"])
    def employee_login():
        data     = request.get_json() or {}
        email    = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        db   = get_db()
        user = db.employee_portal_users.find_one({"email": email}, {"_id": 0})
        if not user:
            return jsonify({"message": "Invalid email or password"}), 401
        if not check_password_hash(user["passwordHash"], password):
            return jsonify({"message": "Invalid email or password"}), 401

        # Fetch full employee profile
        emp = db.employees.find_one({"id": user["employeeId"]}, {"_id": 0})
        token = create_access_token(identity=f"emp:{email}")
        return jsonify({
            "token": token,
            "employee": {
                "id": user["employeeId"],
                "name": user["name"],
                "email": user["email"],
                "empId": user.get("empId",""),
                "department": user.get("department",""),
                "role": user.get("role",""),
                "skills": emp.get("skills",[]) if emp else [],
                "certifications": emp.get("certifications",[]) if emp else [],
                "availability": emp.get("availability","Available") if emp else "Available",
                "imagePreview": emp.get("imagePreview","") if emp else "",
            }
        })

    # ── Employee Portal Auth: Me ──────────────────────────────────────────────
    @app.route("/api/employee/auth/me", methods=["GET"])
    @jwt_required()
    def employee_me():
        identity = get_jwt_identity()
        if not identity.startswith("emp:"):
            return jsonify({"message": "Not an employee token"}), 403
        email = identity[4:]
        db    = get_db()
        user  = db.employee_portal_users.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
        if not user:
            return jsonify({"message": "Employee not found"}), 404
        emp = db.employees.find_one({"id": user["employeeId"]}, {"_id": 0, "passwordHash": 0})
        profile = {**user}
        if emp:
            profile.update({
                "skills": emp.get("skills",[]),
                "certifications": emp.get("certifications",[]),
                "availability": emp.get("availability","Available"),
                "imagePreview": emp.get("imagePreview",""),
                "experience": emp.get("experience", 0),
                "approvedCertDocs": emp.get("approvedCertDocs", []),
            })
        return jsonify(profile)

    # ── PDF Analysis ──────────────────────────────────────────────────────────
    @app.route("/api/pdf/analyze", methods=["POST"])
    def analyze_pdf():
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        f = request.files["file"]
        extracted_text = ""
        try:
            if PDF_AVAILABLE and f.filename.lower().endswith(".pdf"):
                import io
                reader = PyPDF2.PdfReader(io.BytesIO(f.read()))
                for page in reader.pages:
                    extracted_text += (page.extract_text() or "") + "\n"
            else:
                raw = f.read()
                extracted_text = raw.decode("utf-8", errors="ignore")
        except Exception as exc:
            extracted_text = f"[Extraction error: {exc}]"
        skills_found = [sk for sk in SKILL_KEYWORDS if sk.lower() in extracted_text.lower()]
        return jsonify({"success": True, "text": extracted_text[:4000],
                        "wordCount": len(extracted_text.split()),
                        "skills": skills_found, "pdfAvailable": PDF_AVAILABLE})

    # ── Admin Auth: Update Profile ────────────────────────────────────────────
    @app.route("/api/auth/profile", methods=["PUT"])
    @jwt_required()
    def update_profile():
        email = get_jwt_identity()
        data  = request.get_json() or {}
        db    = get_db()
        allowed = ["name","role","dept","mobile","dob","doj","address","bio"]
        update_fields = {k: data[k] for k in allowed if k in data}
        if not update_fields:
            return jsonify({"message": "No valid fields to update"}), 400
        db.users.update_one({"email": email}, {"$set": update_fields}, upsert=False)
        user = db.users.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify(user)

    # ── Admin Auth: Change Password ───────────────────────────────────────────
    @app.route("/api/auth/change-password", methods=["POST"])
    @jwt_required()
    def change_password():
        email = get_jwt_identity()
        data  = request.get_json() or {}
        current_pw = data.get("currentPassword", "")
        new_pw     = data.get("newPassword", "")
        if not current_pw or not new_pw:
            return jsonify({"message": "currentPassword and newPassword are required"}), 400
        if len(new_pw) < 6:
            return jsonify({"message": "New password must be at least 6 characters"}), 400
        db   = get_db()
        user = db.users.find_one({"email": email})
        if user:
            if not check_password_hash(user.get("passwordHash",""), current_pw):
                return jsonify({"message": "Current password is incorrect"}), 401
            db.users.update_one({"email": email}, {"$set": {"passwordHash": generate_password_hash(new_pw)}})
        return jsonify({"success": True, "message": "Password updated successfully"})

    # ── Health ────────────────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        db_error = get_db_init_error() or app.config.get("DB_INIT_ERROR")
        if db_error:
            return jsonify({
                "status": "degraded",
                "service": "NEXA Admin Portal",
                "database": "unavailable",
                "message": db_error,
                "pdfAvailable": PDF_AVAILABLE,
            }), 503
        try:
            db = get_db()
            count = db.employees.count_documents({})
            return jsonify({
                "status": "ok",
                "service": "NEXA Admin Portal",
                "database": "MongoDB",
                "employees": count,
                "pdfAvailable": PDF_AVAILABLE,
            })
        except Exception as exc:
            return jsonify({
                "status": "degraded",
                "service": "NEXA Admin Portal",
                "database": "unavailable",
                "message": str(exc),
                "pdfAvailable": PDF_AVAILABLE,
            }), 503



    @app.route("/", methods=["GET"])
    def root():
        return jsonify({"service": "NEXA Admin Portal API", "health": "/api/health"})

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        return jsonify({"message": "Internal server error", "detail": str(exc)}), 500

    # ── Blueprints ────────────────────────────────────────────────────────────
    app.register_blueprint(employee_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(allocation_bp)
    app.register_blueprint(cert_bp)
    app.register_blueprint(staffid_bp)
    app.register_blueprint(notification_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
