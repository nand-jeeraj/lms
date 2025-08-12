from flask import Blueprint, jsonify, request
from extensions import mongo
from dependencies import get_current_user
from bson import ObjectId
from datetime import datetime
from pymongo import MongoClient
import os
import traceback
import pytz

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

dashboard_router = Blueprint("dashboard", __name__, url_prefix="/api")

@dashboard_router.route("/attendance_dashboard", methods=["GET"])
def dashboard():
    try:
        current_user = get_current_user()

        # Get all filter params from request
        colid = request.args.get("colid")
        program_code = request.args.get("program_code")
        year = request.args.get("year")
        course_code = request.args.get("course_code")
        name = request.args.get("name")  

        pipeline = []

        # Build match filter dynamically
        match_filter = {}
        if colid:
            match_filter["colid"] = colid
        if program_code:
            match_filter["programcode"] = program_code
        if year:
            match_filter["year"] = year
        if course_code:
            match_filter["course_code"] = course_code
        if name:
            match_filter["name"] = name

        if match_filter:
            pipeline.append({"$match": match_filter})

        
        pipeline.extend([
            {
                "$group": {
                    "_id": "$name",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ])

        data = list(db.attendance.aggregate(pipeline))
        return jsonify(data)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500


@dashboard_router.route("/attendance_history", methods=["GET"])
def history():
    try:
        current_user = get_current_user()
        
        colid = request.args.get("colid")
        program_code = request.args.get("program_code")
        year = request.args.get("year")
        name = request.args.get("name")  

        filter_query = {}
        if colid:
            filter_query["colid"] = colid
        
        if program_code:
            filter_query["programcode"] = {"$regex": f"^{program_code}$", "$options": "i"}
        
        if year:
            filter_query["year"] = year
        
        if name:
            filter_query["name"] = {"$regex": f"^{name}$", "$options": "i"}

        recs = list(db.attendance.find(filter_query).sort("timestamp", -1))

        # IST timezone object
        ist = pytz.timezone('Asia/Kolkata')

        for r in recs:
            r["_id"] = str(r["_id"])
            if isinstance(r.get("timestamp"), datetime):
                # Convert UTC to IST
                utc_time = r["timestamp"].replace(tzinfo=pytz.utc)
                ist_time = utc_time.astimezone(ist)
                r["timestamp"] = ist_time.isoformat()
            if "name" not in r and "Student_name" in r:
                r["name"] = r["Student_name"]

        return jsonify(recs)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": f"Internal server error: {str(e)}"}), 500
router = dashboard_router
