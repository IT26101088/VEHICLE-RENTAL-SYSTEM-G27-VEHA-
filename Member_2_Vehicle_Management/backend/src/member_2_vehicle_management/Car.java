package member2;
public class Car extends Vehicle {
    public Car(String id, String brand, String model, double price){ super(id, brand, model, price); }
    @Override public String getType(){ return "Car"; }
}
