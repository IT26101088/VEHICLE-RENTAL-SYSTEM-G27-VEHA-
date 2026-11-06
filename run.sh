#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
mkdir -p out
javac -encoding UTF-8 -d out \
  backend/src/veha/VehaServer.java \
  Member_2_Vehicle_Management/backend/src/member_2_vehicle_management/VehicleListing.java \
  Member_2_Vehicle_Management/backend/src/member_2_vehicle_management/VehicleSelectionSort.java \
  Member_3_Booking_Management/backend/src/member_3_booking_management/RentedVehicleRecord.java \
  Member_3_Booking_Management/backend/src/member_3_booking_management/RentedVehicleLinkedList.java
java -cp out veha.VehaServer "$@"
