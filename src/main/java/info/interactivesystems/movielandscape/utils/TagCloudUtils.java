package info.interactivesystems.movielandscape.utils;

import org.primefaces.model.tagcloud.DefaultTagCloudModel;
import org.primefaces.model.tagcloud.TagCloudModel;

public final class TagCloudUtils {

    private TagCloudUtils() {
    }

    public static TagCloudModel createEmptyTagCloudModel(){
    	return new DefaultTagCloudModel();
    }
}
