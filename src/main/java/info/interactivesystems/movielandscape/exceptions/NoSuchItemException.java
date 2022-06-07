package info.interactivesystems.movielandscape.exceptions;

public class NoSuchItemException extends Exception {
	private static final long serialVersionUID = 2L;
	
	public NoSuchItemException(long id){
		super("No such item found in background data: "+id);
	}
}
