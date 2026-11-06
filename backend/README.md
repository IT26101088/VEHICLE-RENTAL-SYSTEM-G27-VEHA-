# VEHA Java backend

Requires Java 17+. Run commands from the project root (`VEHA_Recreated`).

```bash
./run.sh
```

Open http://localhost:8080. The built-in Java HTTP server serves `Shared_Project` and exposes file-backed endpoints:

- `GET /api/users|vehicles|bookings|payments` — returns stored pipe-separated records as JSON strings
- `POST /api/{resource}` — form body `record=<URL-encoded pipe-separated record>`
- `PUT /api/{resource}/{id}` — form body `record=<URL-encoded replacement record>`
- `DELETE /api/{resource}/{id}` — removes a record
- `GET /api/report` — counts records and sums payment amount field

All data is stored centrally in `data/` as pipe-separated text files. Never store real card details. This is a teaching/demo backend, not production authentication or payment infrastructure.

## Linked list and selection sort endpoints
- `GET /api/vehicles/sorted?by=price|availability&order=asc|desc` - selection sort (`member2.VehicleSelectionSort`); returns `{algorithm, comparisons, swaps, vehicles:[{id, price, available, rentedUntil}]}`
- `GET /api/rented` - rented vehicle records in linked-list order (head to tail); `?vehicleId=v1` searches the list
- `POST /api/rented` with `bookingId=...` - confirms the booking and appends a node (`member3.RentedVehicleLinkedList.addLast`)
- `DELETE /api/rented/{rentalId}` - unlinks the node and marks the booking Completed
- `PUT /api/{resource}` with `records=...` - replaces a whole data file (used by the website to save)
