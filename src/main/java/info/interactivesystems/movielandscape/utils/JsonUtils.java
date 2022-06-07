package info.interactivesystems.movielandscape.utils;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;

import info.interactivesystems.mapviews.mapitems.MovieMapItem;

public class JsonUtils {

    private static ObjectMapper mapper = new ObjectMapper();

    public static String mapItemsToJson(Collection<MovieMapItem> mapItems) {
	StringBuilder stringBuilder = new StringBuilder();
	stringBuilder.append("[");
	String prefix = "";
	for (MovieMapItem mapItem : mapItems) {
	    stringBuilder.append(prefix);
	    prefix = ", ";
	    stringBuilder.append("{");
	    stringBuilder.append("id : ").append(mapItem.getMovielensId()).append(", ");
	    stringBuilder.append("x : ").append(Math.round(mapItem.getX())).append(", ");
	    stringBuilder.append("y : ").append(Math.round(mapItem.getY())).append(", ");
	    stringBuilder.append("image : ").append("'/movie_poster/" + mapItem.getMovielensId() + ".jpg'");
	    stringBuilder.append("}");
	}
	stringBuilder.append("]");
	return stringBuilder.toString();
    }

    public static String toJson(Object object) {
	try {
	    return mapper.writeValueAsString(object);
	} catch (IOException e) {
	    throw new RuntimeException(e);
	}
    }

    public static List<List<String>> getHeightDataFromJson(String json) {
	try {
	    return mapper.readValue(json, new TypeReference<List<List<String>>>() {
	    });
	} catch (IOException e) {
	    throw new RuntimeException(e);
	}
    }

}
