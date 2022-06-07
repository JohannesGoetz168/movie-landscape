package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.mapitems.MapItem;
import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.dao.RatingDAO;
import info.interactivesystems.movielandscape.sampling.KMeansSampler;

@Named
@ApplicationScoped
public class InitialSampleItemsBean implements Serializable {
	private static final long serialVersionUID = 5L;
	private static final Logger log = LoggerFactory.getLogger(InitialSampleItemsBean.class);
	
	private static final int HOW_MANY_SAMPLES_ON_START = 30;
	private Set<MovieMapItem> initialSampleItems;

	@Inject
	private MapItemBean mapItemBean;
	
	@Inject
	private RatingDAO ratingDao;

	@PostConstruct
	public void setUp() {
		log.debug("Calculating {} initial samples using k-means..", HOW_MANY_SAMPLES_ON_START);
		initialSampleItems = calculateKMeansSamples(HOW_MANY_SAMPLES_ON_START);
		log.debug("Done calculating initial samples.");
	}

	private Set<MovieMapItem> calculateKMeansSamples(int howMany) {
		Set<MovieMapItem> kMeansSamples = new HashSet<MovieMapItem>();
		KMeansSampler sampler = new KMeansSampler();
		for (MapItem item : sampler.sampleItems(mapItemBean.getAllMapItems(), howMany)) {
			int popularity = 0;
			MovieMapItem sample = null;
			for (MovieMapItem clusterItem : sampler.getClusters().get(item)) {
			    int popularityCurrentItem = ratingDao.countRatingsForMovie(clusterItem.getMovielensId());
				if (popularityCurrentItem > popularity) {
					popularity = popularityCurrentItem;
					sample = clusterItem;
				}
			}
			if (sample != null) {
				kMeansSamples.add(sample);
			}
		}
		return kMeansSamples;
	}
	
	public Set<MovieMapItem> getInitialSamples(){
		return initialSampleItems;
	}

}
