package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.text.SimpleDateFormat;

import javax.annotation.PostConstruct;
import javax.enterprise.context.SessionScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.primefaces.model.tagcloud.DefaultTagCloudModel;
import org.primefaces.model.tagcloud.TagCloudModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.dao.MovieDAO;
import info.interactivesystems.movielandscape.utils.TagCloudUtils;
import info.interactivesystems.movielensmetadata.commons.Movie;

@Named
@SessionScoped
public class DetailsBean implements Serializable {
	private static final Logger log = LoggerFactory.getLogger(DetailsBean.class);
	private static final long serialVersionUID = 12L;

	private MovieMapItem currentItem;
	private Movie currentMovie;
	private TagCloudModel model;

	@Inject
	private MovieDAO movieDAO;

	@Inject
	private RecommendationBean recommendationBean;

	@PostConstruct
	public void init() {
		currentItem = new MovieMapItem();
		model = new DefaultTagCloudModel();
	}

	public void changeCurrentItem(MovieMapItem mapItem) {
		this.currentItem = mapItem;
		this.currentMovie = movieDAO.findMovie(mapItem.getMovielensId());
		this.model = TagCloudUtils.createEmptyTagCloudModel();
		log.debug("Changed current item to: {} ({})", mapItem.getMovielensId(), currentMovie.getTitle());
	}

	public TagCloudModel getTagModel() {
		return model;
	}

	public MovieMapItem getCurrentItem() {
		return currentItem;
	}

	public String getReleaseYear() {
		try {
			SimpleDateFormat simpleDateformat = new SimpleDateFormat("yyyy");
			return simpleDateformat.format(currentMovie.getReleaseDate());
		} catch (NullPointerException npe) {
			log.warn("No date found for current item!");
			return "";
		}
	}

	public int getPredictedRating() {
		if (recommendationBean.getUserPreferences().containsKey(currentItem)) {
			return Math.round(recommendationBean.getUserPreferences().get(currentItem).floatValue());
		} else {
			return 1;
		}
	}

	public Movie getCurrentMovie() {
	    return currentMovie;
	}

}
