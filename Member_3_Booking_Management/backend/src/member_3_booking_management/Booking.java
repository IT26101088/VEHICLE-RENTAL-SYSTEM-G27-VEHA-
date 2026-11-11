package member3;

import java.time.LocalDate;

public class Booking {
    private String id, customerId, vehicleId, status;
    private LocalDate pickupDate, returnDate;
    public Booking(String id, String customerId, String vehicleId, LocalDate pickupDate, LocalDate returnDate) {
        if (pickupDate == null || returnDate == null || returnDate.isBefore(pickupDate))
            throw new IllegalArgumentException("Return date must be on or after pickup date.");
        this.id=id; this.customerId=customerId; this.vehicleId=vehicleId;
        this.pickupDate=pickupDate; this.returnDate=returnDate; this.status="PENDING";
    }
    public String getId(){ return id; }
    public String getCustomerId(){ return customerId; }
    public String getVehicleId(){ return vehicleId; }
    public LocalDate getPickupDate(){ return pickupDate; }
    public LocalDate getReturnDate(){ return returnDate; }
    public String getStatus(){ return status; }
    public void setStatus(String status){ this.status=status; }
    public void changeDates(LocalDate pickup, LocalDate ret){
        if (pickup == null || ret == null || ret.isBefore(pickup))
            throw new IllegalArgumentException("Invalid booking dates.");
        pickupDate=pickup; returnDate=ret;
    }
}
