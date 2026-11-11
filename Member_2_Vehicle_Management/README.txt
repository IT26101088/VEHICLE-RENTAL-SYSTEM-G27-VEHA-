Member 2 — Vehicle Management
=============================

Frontend pages copied from the supplied project:
- vehicles.html
- vehicle.html

Backend: Java starter classes are included under backend/src. Data file is under data/.
Important: These are starter templates, not a fully integrated production backend. Connect the frontend to the Java logic and add validation/testing.

ALGORITHM: SELECTION SORT (assigned to Member 2)
------------------------------------------------
Files : backend/src/member_2_vehicle_management/VehicleSelectionSort.java  (the algorithm)
        backend/src/member_2_vehicle_management/VehicleListing.java        (vehicle row + availability)
Use   : sorts vehicles by rent price (low->high / high->low) or by availability
        (available first / rented first). Hand-written loops, no Arrays.sort.
API   : GET /api/vehicles/sorted?by=price|availability&order=asc|desc
        (returns the sorted ids plus the number of comparisons and swaps)
UI    : storefront vehicles.html sort box, and the admin dashboard > Vehicles > sort box.
