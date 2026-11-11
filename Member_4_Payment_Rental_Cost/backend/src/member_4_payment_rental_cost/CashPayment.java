package member4;
public class CashPayment extends Payment {
    public CashPayment(String id, String bookingId, double amount) { super(id, bookingId, amount, "CASH"); }
    @Override public String getPaymentDescription(){ return "Simulated cash payment"; }
}
