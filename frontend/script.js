document.addEventListener("DOMContentLoaded", function () {
    const singleForm = document.getElementById("single-form");
    const batchForm = document.getElementById("batch-form");
    const predictionForm = document.getElementById("prediction-form");
    const fileUpload = document.getElementById("file-upload");
    const uploadBtn = document.getElementById("upload-btn");
    const resultDiv = document.getElementById("result");

    // Toggle between Single and Batch Prediction
    document.querySelectorAll('input[name="mode"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            if (this.value === "single") {
                singleForm.style.display = "block";
                batchForm.style.display = "none";
            } else {
                singleForm.style.display = "none";
                batchForm.style.display = "block";
            }
            resultDiv.innerHTML = ""; // Clear result on mode change
        });
    });

    // Update slider values in real-time
    function updateSliderValue(sliderId, outputId) {
        const slider = document.getElementById(sliderId);
        const output = document.getElementById(outputId);
        slider.addEventListener("input", function () {
            output.innerText = this.value;
        });
    }

    updateSliderValue("totalYears", "totalYears-value");
    updateSliderValue("yearsInRole", "yearsInRole-value");
    updateSliderValue("age", "age-value");
    updateSliderValue("yearsWithManager", "yearsWithManager-value");

    // Handle Single Prediction Submission
    predictionForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent page refresh

        // Collect user inputs
        const data = {
            TotalWorkingYears: parseInt(document.getElementById("totalYears").value),
            JobLevel: parseInt(document.getElementById("jobLevel").value),
            YearsInCurrentRole: parseInt(document.getElementById("yearsInRole").value),
            MonthlyIncome: parseInt(document.getElementById("monthlyIncome").value),
            Age: parseInt(document.getElementById("age").value),
            YearsWithCurrManager: parseInt(document.getElementById("yearsWithManager").value),
            JobSatisfaction: parseInt(document.getElementById("jobSatisfaction").value),
        };

        // Send AJAX request to FastAPI
        fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            resultDiv.innerHTML = `<p>Attrition Prediction: <strong>${result.attrition_prediction}</strong></p>`;
        })
        .catch(error => {
            resultDiv.innerHTML = `<p style="color:red;">Error: ${error}</p>`;
        });
    });

    // Handle Batch Prediction (CSV Upload)
    uploadBtn.addEventListener("click", function () {
        const file = fileUpload.files[0];
        if (!file) {
            alert("Please select a CSV file.");
            return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
    
        // Send AJAX request to FastAPI for batch processing
        fetch("http://127.0.0.1:8000/predict-batch", {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(result => {
            if (result.download_link) {
                resultDiv.innerHTML = `<p>Batch Prediction Completed. <a href="${result.download_link}" download>Download Results</a></p>`;
            } else {
                resultDiv.innerHTML = `<p style="color:red;">Error: Could not process file.</p>`;
            }
        })
        .catch(error => {
            resultDiv.innerHTML = `<p style="color:red;">Error: ${error}</p>`;
        });
    });
    
});
