package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.enterprise.context.SessionScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import edu.wlu.cs.levy.CG.KDTree;
import edu.wlu.cs.levy.CG.KeyDuplicateException;
import edu.wlu.cs.levy.CG.KeySizeException;
import info.interactivesystems.mapviews.commons.util.MathUtils;
import info.interactivesystems.mapviews.mapitems.MapItem;
import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.dao.RatingDAO;
import info.interactivesystems.movielandscape.exceptions.NoNearItemFoundException;

@Named
@SessionScoped
public class SampleItemsBean implements Serializable {
	private static final long serialVersionUID = 3L;
	private static final Logger log = LoggerFactory.getLogger(SampleItemsBean.class);

	private Set<MovieMapItem> sampleItems;
	private KDTree<MovieMapItem> mapItemKDTree;
	
	@Inject
	private MapItemBean mapItemBean;
	
	@Inject
	private RatingDAO ratingDao;
	
	@Inject
	private InitialSampleItemsBean initialSampleItemsBean;

	@PostConstruct
	public void setUp() {
		sampleItems = new HashSet<MovieMapItem>();
		sampleItems.addAll(initialSampleItemsBean.getInitialSamples());
		setupKDTree();
	}

	private void setupKDTree() {
		mapItemKDTree = new KDTree<>(2);
		for (MovieMapItem mapItem : mapItemBean.getAllMapItems()) {
			double[] coords = { mapItem.getX(), mapItem.getY() };
			try {
				mapItemKDTree.insert(coords, mapItem);
			} catch (KeySizeException | KeyDuplicateException e) {
				log.error("Cannot insert mapItem into kdTree.", e);
			}
		}
	}

	public MovieMapItem addSampleAt(double x, double y) {
		MovieMapItem sampleToAdd = getMostPopularItemAt(x, y, 5, 5);
		addSample(sampleToAdd);
		return sampleToAdd;
	}

	private void addSample(MovieMapItem sample) {
		this.sampleItems.add(sample);
	}

	private MovieMapItem getMostPopularItemAt(double x, double y, int consideredNearItems, double maxRadius) {
		if (consideredNearItems >= mapItemBean.getAllMapItems().size()) {
			log.error("No nearest items can be found! Position: ({},{})", x, y);
			throw new NoNearItemFoundException(x, y);
		}
		try {
			double[] coords = { x, y };
			int popularityMax = 0;
			MovieMapItem mostPopularItem = null;
			List<MovieMapItem> foundItems = this.mapItemKDTree.nearest(coords, consideredNearItems);
			for (MovieMapItem foundItem : foundItems) {
				double distance = MathUtils.calculateEuclideanDistance(foundItem.getX(), foundItem.getY(), x, y);
				int popularity = ratingDao.countRatingsForMovie(foundItem.getMovielensId());
				if (!sampleItems.contains(foundItem) && popularity > popularityMax && distance <= maxRadius) {
					mostPopularItem = foundItem;
					popularityMax = popularity;
				}
			}
			if (mostPopularItem != null) {
				return mostPopularItem;
			}
		} catch (KeySizeException e) {
			log.error("Could not find nearest item.", e);
		}
		return getMostPopularItemAt(x, y, consideredNearItems + 5, maxRadius + 5);
	}

	public void removeSample(MapItem sample) {
		this.sampleItems.remove(sample);
	}

	public void resetSamples() {
		this.sampleItems.clear();
		this.sampleItems.addAll(initialSampleItemsBean.getInitialSamples());
	}

	public Collection<MovieMapItem> getSampleMapItems() {
		return sampleItems;
	}
}
