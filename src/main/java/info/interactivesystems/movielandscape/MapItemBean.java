package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.commons.util.MapScaler;
import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.dao.MapItemDAO;
import info.interactivesystems.movielandscape.exceptions.NoSuchItemException;

@Named
@ApplicationScoped
public class MapItemBean implements Serializable {
    private static final long serialVersionUID = 1L;

    private static final int SCALE_DIMENSION = 256;
    private static final Logger log = LoggerFactory.getLogger(MapItemBean.class);

    private static final String reducer = "ParallelSgdMdsReducer-20-0.001-30";

    @Inject
    private MapItemDAO mapItemDAO;

    private Map<Long, MovieMapItem> allMapItems;

    @PostConstruct
    public void setUp() {
	fetchMapItems();
    }

    private Map<Long, MovieMapItem> fetchMapItems() {
	log.debug("Start fetching map items...");
	allMapItems = new HashMap<Long, MovieMapItem>();
	Collection<MovieMapItem> fetchedMapItems = mapItemDAO.getAllMapItems(reducer);
	Collection<MovieMapItem> scaledItems = MapScaler.scale(fetchedMapItems, 20, SCALE_DIMENSION-20, 20, SCALE_DIMENSION-20);
	for (MovieMapItem mapItem : scaledItems) {
	    allMapItems.put(mapItem.getMovielensId(), mapItem);
	}

	log.debug("Done fetching map items.");
	return allMapItems;
    }

    public Collection<MovieMapItem> getAllMapItems() {
	return allMapItems.values();
    }

    public MovieMapItem getMapItem(long movielensId) throws NoSuchItemException {
	if (!allMapItems.containsKey(movielensId)) {
	    throw new NoSuchItemException(movielensId);
	}
	return allMapItems.get(movielensId);
    }
}
