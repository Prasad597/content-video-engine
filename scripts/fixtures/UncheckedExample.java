// Companion to the on-screen method-body excerpt. Not a build dependency.
public class UncheckedExample {
    private static int getValue() {
        return Integer.parseInt(System.getProperty("divisor", "0"));
    }

    public static void main(String[] args) {
        int a = 10;
        int b = getValue();

        System.out.println(a / b);
    }
}
