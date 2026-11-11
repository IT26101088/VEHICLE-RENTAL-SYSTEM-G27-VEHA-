Member 3 — Booking Management
=============================

Frontend pages copied from the supplied project:
- bookings.html

Backend: Java starter classes are included under backend/src. Data file is under data/.
Important: These are starter templates, not a fully integrated production backend. Connect the frontend to the Java logic and add validation/testing.

DATA STRUCTURE: SINGLY LINKED LIST (assigned to Member 3)
---------------------------------------------------------
Files : backend/src/member_3_booking_management/RentedVehicleLinkedList.java  (the linked list)
        backend/src/member_3_booking_management/RentedVehicleRecord.java      (data held in each node)
Use   : manages rented vehicle records. A node is added at the tail when a booking becomes
        'Confirmed' and unlinked when it is Completed, Cancelled or deleted.
        Operations: addLast, addFirst, removeByRentalId, removeByBookingId, findByRentalId,
        findByBookingId, findActiveByVehicle, sync, toList.
Data  : data/rented.txt   (rentalId|bookingId|vehicleId|vehicleName|customerEmail|pickup|ret|status)
API   : GET /api/rented[?vehicleId=v1]   POST /api/rented (bookingId=...)   DELETE /api/rented/{rentalId}
UI    : admin dashboard > Rented vehicles (shows HEAD -> node -> ... -> NULL).
