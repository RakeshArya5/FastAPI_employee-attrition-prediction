from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import os
from fastapi.responses import FileResponse

# Initialize FastAPI app
app = FastAPI()

# Add CORS Middleware (Right after app initialization)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any frontend (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Load the trained model
model = joblib.load("models/employee_attrition_model.pkl")

# Define input features
features = ["TotalWorkingYears", "JobLevel", "YearsInCurrentRole", "MonthlyIncome",
            "Age", "YearsWithCurrManager", "JobSatisfaction"]

# Single Prediction Endpoint
@app.post("/predict")
def predict_attrition(data: dict):
    df = pd.DataFrame([data])
    df = df[features]
    prediction = model.predict(df)[0]
    result = "Yes" if prediction == 1 else "No"
    return {"attrition_prediction": result}

# Batch Prediction Endpoint
# Batch Prediction Endpoint - Saves the file correctly
@app.post("/predict-batch")
async def predict_batch(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

    # Ensure all required columns exist
    missing_columns = [col for col in features if col not in df.columns]
    if missing_columns:
        return {"error": f"Missing columns in CSV: {', '.join(missing_columns)}"}

    # Make predictions
    predictions = model.predict(df[features])

    # Add predictions to DataFrame
    df["Attrition_Prediction"] = ["Yes" if pred == 1 else "No" for pred in predictions]

    # Ensure the downloads directory exists
    download_folder = "downloads"
    os.makedirs(download_folder, exist_ok=True)

    # Save the predictions CSV inside the downloads folder
    output_file = os.path.join(download_folder, "batch_predictions.csv")
    df.to_csv(output_file, index=False)

    # Return a **full** download URL
    return {"download_link": f"http://127.0.0.1:8000/download/batch_predictions.csv"}


# Correctly serve the batch predictions file for download
@app.get("/download/{file_name}")
def download_file(file_name: str):
    file_path = os.path.join("downloads", file_name)
    
    if os.path.exists(file_path):
        return FileResponse(path=file_path, filename=file_name, media_type='text/csv')
    
    return {"error": "File not found"}


# Root endpoint
@app.get("/")
def home():
    return {"message": "Employee Attrition Prediction API is running"}
