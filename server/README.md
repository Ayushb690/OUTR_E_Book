# OUTR E-Book

A modern, web-based E-Book Management System designed to streamline book borrowing, inventory tracking, and automated fine management.

## 🚀 The Problem It Solves

Traditional e-book management often suffers from manual errors, slow processing of requests, and lack of transparency for students. This application solves these issues by:
*   **Automating Fine Calculations:** Eliminates manual date checking by using a nightly cron job to calculate overdue fines.
*   **Real-time Availability:** Students can search for books and see instant availability status.
*   **Digital Workflow:** Replaces paper-based requests with a digital approval system for librarians.
*   **Account Transparency:** Students can track their active issues, due dates, and request history from a personalized dashboard.

## ✨ Key Features

### 👨‍🎓 For Students
*   **Search Engine:** Find books by title, author, or ISBN.
*   **Availability Filter:** Quickly filter the collection to see only available books or out-of-stock titles.
*   **Borrowing System:** Request books digitally and track approval status.
*   **Personal Dashboard:** View active issues, upcoming due dates, and current fines.
*   **Account Profile:** View and manage personal membership details.

### 🧙‍♂️ For Librarians (Admin)
*   **Request Management:** Centralized dashboard to approve or reject student borrow requests.
*   **Inventory Control:** Update book status (Damaged, Lost, Replaced) and track total vs. available stock with real-time filtering.
*   **Supplier Management:** Maintain a directory of book suppliers.
*   **Automated Audits:** Daily background jobs to mark books as overdue and update fines (₹50/day).
*   **Reporting:** Stock summaries and transaction history tracking.

## 🛠️ Tech Stack
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Frontend:** EJS (Embedded JavaScript Templates), Bootstrap 5, Vanilla JS
*   **Authentication:** JWT (JSON Web Tokens) with LocalStorage persistence
*   **Automation:** Node-Cron for scheduled tasks

## 🛠️ Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your `.env` file with `MONGO_URI` and `JWT_SECRET`
4. Seed the database (optional): `node seed.js`
5. Start the server: `npm start`

## 🔑 Default Credentials

**Crucial:** You must run the seed script (`node seed.js`) first to create these accounts in your database.

### 🧙‍♂️ Librarian (Admin)
*   **Email:** `admin1@test.com` (or `admin2@test.com`)
*   **Password:** `admin123`

### 👨‍🎓 Student (User)
*   **Email:** `student1@test.com` (up to `student5@test.com`)
*   **Password:** `admin123`

## 📖 Usage

1.  **Seed the Database:** Run `node seed.js` in your terminal to create the default admin and student accounts.
2.  **Start Server:** Run `npm start`.
3.  **Login:** Navigate to `http://localhost:5000/login`.
4.  **Enter Credentials:** Use one of the email/password combinations provided above.
5.  **Access Dashboards:**
    *   **Librarians** will be redirected to the Librarian Dashboard (Manage books, requests, suppliers).
    *   **Students** will be redirected to the Student Dashboard (Search books, track issues, view fines).
