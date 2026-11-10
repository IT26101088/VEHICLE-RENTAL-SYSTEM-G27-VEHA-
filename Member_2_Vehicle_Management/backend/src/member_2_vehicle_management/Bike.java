package member2;
public class Bike extends Vehicle {
    public Bike(String id, String brand, String model, double price){ super(id, brand, model, price); }
    @Override public String getType(){ return "Bike"; }
}
