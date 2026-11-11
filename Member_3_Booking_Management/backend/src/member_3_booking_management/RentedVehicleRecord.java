package member3;

import java.time.LocalDate;

/**
 * One rented-vehicle record (a node's data in the linked list).
 * Stored in data/rented.txt as:
 * rentalId|bookingId|vehicleId|vehicleName|customerEmail|pickup|ret|status
 */
public class RentedVehicleRecord {
    private final String rentalId, bookingId, vehicleId, vehicleName, customerEmail, pickup, ret, status;

    public RentedVehicleRecord(String rentalId, String bookingId, String vehicleId, String vehicleName,
                               String customerEmail, String pickup, String ret, String status) {
        this.rentalId = clean(rentalId); this.bookingId = clean(bookingId); this.vehicleId = clean(vehicleId);
        this.vehicleName = clean(vehicleName); this.customerEmail = clean(customerEmail);
        this.pickup = clean(pickup); this.ret = clean(ret); this.status = clean(status);
    }

    private static String clean(String s) { return s == null ? "" : s.replace('|', ' ').replace('\n', ' ').replace('\r', ' ').trim(); }

    public static RentedVehicleRecord fromRecord(String line) {
        String[] f = line.split("\\|", -1);
        return new RentedVehicleRecord(at(f, 0), at(f, 1), at(f, 2), at(f, 3), at(f, 4), at(f, 5), at(f, 6), at(f, 7));
    }
    private static String at(String[] f, int i) { return i < f.length ? f[i] : ""; }

    public String toRecord() {
        return String.join("|", rentalId, bookingId, vehicleId, vehicleName, customerEmail, pickup, ret, status);
    }

    public String getRentalId() { return rentalId; }
    public String getBookingId() { return bookingId; }
    public String getVehicleId() { return vehicleId; }
    public String getVehicleName() { return vehicleName; }
    public String getCustomerEmail() { return customerEmail; }
    public String getPickup() { return pickup; }
    public String getReturnDate() { return ret; }
    public String getStatus() { return status; }

    /** True while the vehicle is still out or reserved (return date today or later). */
    public boolean isActiveOn(LocalDate today) {
        try { return !LocalDate.parse(ret).isBefore(today); } catch (Exception e) { return true; }
    }
}
