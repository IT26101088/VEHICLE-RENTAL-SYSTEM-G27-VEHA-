package member4;

public abstract class Payment {
    private String id, bookingId, method, status;
    private double amount;
    public Payment(String id, String bookingId, double amount, String method) {
        if (amount < 0) throw new IllegalArgumentException("Amount cannot be negative");
        this.id=id; this.bookingId=bookingId; this.amount=amount; this.method=method; this.status="PENDING";
    }
    public String getId(){ return id; }
    public String getBookingId(){ return bookingId; }
    public double getAmount(){ return amount; }
    public String getMethod(){ return method; }
    public String getStatus(){ return status; }
    public void setStatus(String status){ this.status=status; }
    public abstract String getPaymentDescription();
}
