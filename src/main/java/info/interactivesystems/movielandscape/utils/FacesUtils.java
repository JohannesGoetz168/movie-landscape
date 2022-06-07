package info.interactivesystems.movielandscape.utils;

import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;

import org.primefaces.context.RequestContext;

public class FacesUtils {
    public static void growlError(String message) {
	RequestContext.getCurrentInstance().update("homeForm:growl");
	    FacesContext context = FacesContext.getCurrentInstance();
	    context.addMessage(null, new FacesMessage(FacesMessage.SEVERITY_ERROR, message, message));
    }

}
