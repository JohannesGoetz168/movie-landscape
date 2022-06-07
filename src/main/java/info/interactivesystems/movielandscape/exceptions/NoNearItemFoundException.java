package info.interactivesystems.movielandscape.exceptions;

public class NoNearItemFoundException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	
	public NoNearItemFoundException(double x, double y) {
	    super("There is no item near ("+x+", "+y+").");
	}

}
