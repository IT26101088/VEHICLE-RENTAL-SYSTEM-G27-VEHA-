VEHICLE RENTAL SYSTEM — MEMBER-WISE FOLDER SPLIT
================================================

Shared_Project/
  Contains the original home page, common CSS/JS/images, and the current HTML pages.

Member_1_User_Management/
  auth.html copied into frontend; Java starter classes; users.txt

Member_2_Vehicle_Management/
  vehicles.html and vehicle.html copied into frontend; Java starter classes; vehicles.txt

Member_3_Booking_Management/
  bookings.html copied into frontend; Java starter classes; bookings.txt

Member_4_Payment_Rental_Cost/
  Java starter classes and payments.txt. Payment-specific frontend pages were not present in the supplied ZIP, so create them in this member's frontend folder.

Member_5_Admin_Dashboard_Reports/
  dashboard.html copied into frontend; Java starter class for reading member data and generating a summary report.

Notes:
- Original frontend files are preserved in Shared_Project.
- Member frontend pages reference shared assets in Shared_Project/assets to avoid duplicate image files.
- This is a responsibility-based split and Java starter scaffold, not a fully integrated Java web application.
- Text files use pipe-separated records; see comments in each manager class for field order.
- For a shared data setup, agree on one project-root data directory and update file paths consistently.
