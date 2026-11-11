package member2;
public class Van extends Vehicle {
    public Van(String id, String brand, String model, double price){ super(id, brand, model, price); }
    @Override public String getType(){ return "Van"; }
}
