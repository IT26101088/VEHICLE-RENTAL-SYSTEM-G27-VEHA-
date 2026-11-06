# VEHA — Vehicle Rental Management System

Recreated from the supplied VEHA_Web project. Includes the original responsive VEHA website, five member-wise starter modules, a unified Java 17 file-backed HTTP backend, and central text storage.

## Run
- Windows: double-click `run.bat` (or run it from a terminal).
- macOS/Linux: `./run.sh`
- Open `http://localhost:8080`.

## Member split
1. User management — `Member_1_User_Management`
2. Vehicle management — `Member_2_Vehicle_Management`
3. Booking management — `Member_3_Booking_Management`
4. Payment and rental costs — `Member_4_Payment_Rental_Cost`
5. Admin dashboard and reports — `Member_5_Admin_Dashboard_Reports`

The shared website is in `Shared_Project/`. Central data files are in `data/`. API and record formats are documented in `backend/README.md`. Payment screens and profile-specific screens are listed as planned member deliverables in the source split; this archive preserves the supplied website pages and adds the integrated backend foundation.

**Student-project note:** payments are simulated. Do not enter or store actual card numbers, CVVs, or bank credentials. When the app is opened through `http://localhost:8080` with the Java backend running, the shared frontend writes changes to the central text files. Browser `localStorage` is only a cache/fallback and is not a substitute for server persistence. A visible warning appears if a write fails.

## Where data is saved (viva)
Run the Java server (`run.bat` / `./run.sh`) from this project root and open `http://localhost:8080` (do not open HTML files with `file://`). The frontend sends changes to the Java API, which writes to its own text file in `data/` (pipe-separated, one record per line):

| Member | Module | File |
|---|---|---|
| 1 | User management | `data/users.txt` — `email\|name\|phone\|role\|updatedAt` |
| 2 | Vehicle management | `data/vehicles.txt` — `id\|name\|type\|city\|price\|seats\|transmission\|fuel\|year\|rating\|reviews\|tag\|about` |
| 3 | Booking management | `data/bookings.txt` — `id\|userName\|userEmail\|vehicleId\|city\|pickup\|ret\|days\|extras\|total\|status\|createdAt` |
| 4 | Payments | `data/payments.txt` — `id\|booking\|amount\|method\|status\|date` |
| 5 | Admin dashboard | edits vehicles and bookings; `GET /api/report` summarises all files |

Passwords are not stored. If you open pages without the Java server (including `file://`), changes cannot be saved to the central `.txt` files. The payments page loads `data.js` before its page script so payment history and submissions can use the backend correctly.

## Verify persistence
After creating a user, vehicle, booking, or simulated payment, inspect the matching file under `data/`. You can also open `/api/users`, `/api/vehicles`, `/api/bookings`, `/api/payments`, or `/api/rented` in the same browser. Stop and restart the server, reload the page, and confirm the records remain. Keep the project root as the server working directory so the relative `data/` path resolves correctly.

## Data structures and algorithms
| Member | What | Files |
|---|---|---|
| 3 - Booking management | **Singly linked list** of rented vehicle records | `Member_3_Booking_Management/backend/src/member_3_booking_management/RentedVehicleLinkedList.java`, `RentedVehicleRecord.java` |
| 2 - Vehicle management | **Selection sort** of vehicles by rent price or availability | `Member_2_Vehicle_Management/backend/src/member_2_vehicle_management/VehicleSelectionSort.java`, `VehicleListing.java` |

Integration: `backend/src/veha/VehaServer.java` calls both classes. Confirming a booking appends a node to the linked list (saved in `data/rented.txt`); completing, cancelling or deleting the booking unlinks it. Vehicle availability is read from that list when the selection sort runs.

Extra endpoints: `GET /api/vehicles/sorted?by=price|availability&order=asc|desc`, `GET|POST /api/rented`, `DELETE /api/rented/{rentalId}`.
