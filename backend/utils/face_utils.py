import json
import numpy as np
import face_recognition
from extensions import mongo
from io import BytesIO
from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

# Load all known student encodings and names from the DB
def load_known_faces_from_db():
    known_encs = []
    known_names = []

    students = db.users.find({
        "role": {"$regex": "^student$", "$options": "i"},
        "facedata": {"$exists": True}
    })

    for student in students:
        try:
            
            encoding = np.array(student["facedata"])
            known_encs.append(encoding)
            known_names.append(student["name"])
        except Exception as e:
            print(f"Failed to load face for {student.get('name')}: {e}")
            continue

    return known_encs, known_names




def recognize_faces_from_bytes(image_bytes, known_encs, known_names):
    try:
       
        img = face_recognition.load_image_file(BytesIO(image_bytes))

        
        face_locations = face_recognition.face_locations(img)
        face_encodings = face_recognition.face_encodings(img, face_locations)

        recognized_names = set()
        unknown_count = 0

        for face_enc in face_encodings:
            if not known_encs:
                unknown_count += 1
                continue

            distances = face_recognition.face_distance(known_encs, face_enc)
            best_match_index = np.argmin(distances)

            if distances[best_match_index] < 0.45:  
                recognized_names.add(known_names[best_match_index])
            else:
                unknown_count += 1

        return list(recognized_names), unknown_count, len(face_encodings)

    except Exception as e:
        print("Recognition failed:", e)
        return [], 0, 0
