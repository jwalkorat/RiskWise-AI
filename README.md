# RiskWise AI

An open-source academic dashboard that utilizes machine learning to predict student dropout risk and automates multi-channel notifications (SMS and Email).

## Overview
RiskWise AI analyzes raw academic data, such as subject marks and attendance, and processes it through a custom-trained machine learning model to calculate a real-time risk score. Based on the calculated risk category, the system can automatically trigger intervention alerts to mentors and parents.

### Architecture & Features
* **Predictive Model**: Integrates a Python-based CatBoost classification model to evaluate risk based on historical academic data.
* **Role-Based Interfaces**: 
  * **Coordinator Portal**: Administrative dashboard for college-wide analytics, managing users, and triggering emergency bulk SMS broadcasts.
  * **Teacher Portal**: Interface for submitting raw student data.
  * **Mentor Portal**: Interface for logging intervention sessions and triggering bulk automated alerts for high-risk students.
  * **Student Portal**: Interface for students to monitor their risk metrics and upload medical documentation.
* **Assignment Verification DL**: Utilizes a custom PyTorch Deep Learning model to automatically scan student assignment uploads, strictly rejecting typed documents and enforcing handwritten submissions.
* **Automated Notifications**: 
  * Automatically generates in-memory PDF reports and dispatches them via email using the Brevo REST API.
  * Triggers SMS alerts for critical cases using the Twilio API.

## Tech Stack

**Frontend:**
* Next.js 15 (React Framework)
* Tailwind CSS
* Shadcn UI & Lucide Icons (Interface components)
* Recharts (Data visualization & radar charts)

**Backend & Database:**
* Next.js API Routes
* Supabase (PostgreSQL Database & Authentication)
* pdf-lib (Dynamic in-memory PDF report generation)

**Machine Learning & AI:**
* Python 3
* CatBoost (Risk classification model)
* PyTorch (Deep Learning model for handwritten vs typed assignment verification)
* Scikit-Learn & Pandas

**External APIs & Deployment:**
* Brevo API (Email dispatch)
* Twilio API (SMS dispatch)
* Docker & Hugging Face Spaces (Containerization and Hosting)

## Installation & Setup

If you would like to fork and run this project locally, follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/jwalkorat/riskwise-ai.git
   cd riskwise-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   # Database Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # SMS Configuration (Twilio)
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_number

   # Email Configuration (Brevo)
   BREVO_API_KEY=your_brevo_api_key
   EMAIL_USER=your_verified_sender_email
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Contributing
If you wish to contribute, feel free to fork the repository, create a feature branch, and submit a pull request. Ensure that you have the required Python dependencies installed (`catboost`, `scikit-learn`, `pandas`, `torch`) if you intend to modify the ML evaluation scripts.
