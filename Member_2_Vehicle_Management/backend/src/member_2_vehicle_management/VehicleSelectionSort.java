package member2;

import java.util.Comparator;

/**
 * MEMBER 2 - Vehicle Management: SELECTION SORT.
 *
 * Sorts vehicles by rent price or by availability. Written by hand (no
 * Arrays.sort / Collections.sort) so the algorithm can be shown in the viva.
 *
 * How it works: for position i = 0 .. n-2, scan the unsorted part (i+1 .. n-1)
 * to find the "smallest" element according to the comparator, then swap it into
 * position i. Time O(n^2) comparisons, at most n-1 swaps. Not stable, so the
 * comparators below add tie-breakers to keep the result deterministic.
 */
public class VehicleSelectionSort {
    private int comparisons;
    private int swaps;

    /** Sorts the array in place using selection sort. */
    public void sort(VehicleListing[] items, Comparator<VehicleListing> order) {
        comparisons = 0;
        swaps = 0;
        int n = items.length;
        for (int i = 0; i < n - 1; i++) {
            int best = i;                              // index of the smallest item found so far
            for (int j = i + 1; j < n; j++) {
                comparisons++;
                if (order.compare(items[j], items[best]) < 0) best = j;
            }
            if (best != i) {                           // swap smallest into place
                VehicleListing tmp = items[i];
                items[i] = items[best];
                items[best] = tmp;
                swaps++;
            }
        }
    }

    public int getComparisons() { return comparisons; }
    public int getSwaps() { return swaps; }

    /** Rent price per day; ties broken by vehicle id. */
    public static Comparator<VehicleListing> byRentPrice(boolean ascending) {
        return (a, b) -> {
            int c = Double.compare(a.getPricePerDay(), b.getPricePerDay());
            if (!ascending) c = -c;
            return c != 0 ? c : a.getId().compareTo(b.getId());
        };
    }

    /** Availability: available vehicles first (or rented first); ties broken by price then id. */
    public static Comparator<VehicleListing> byAvailability(boolean availableFirst) {
        return (a, b) -> {
            int c = Boolean.compare(b.isAvailable(), a.isAvailable()); // available (true) sorts first
            if (!availableFirst) c = -c;
            if (c != 0) return c;
            c = Double.compare(a.getPricePerDay(), b.getPricePerDay());
            return c != 0 ? c : a.getId().compareTo(b.getId());
        };
    }
}
