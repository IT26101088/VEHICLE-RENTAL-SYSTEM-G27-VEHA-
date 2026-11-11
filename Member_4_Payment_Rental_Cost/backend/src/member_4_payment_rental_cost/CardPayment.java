package member4;
public class CardPayment extends Payment {
    public CardPayment(String id, String bookingId, double amount) { super(id, bookingId, amount, "CARD"); }
    @Override public String getPaymentDescription(){ return "Simulated card payment — do not collect real card details"; }
}
