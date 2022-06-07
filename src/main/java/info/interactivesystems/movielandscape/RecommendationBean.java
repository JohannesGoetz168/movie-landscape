package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.enterprise.context.SessionScoped;
import javax.inject.Inject;
import javax.inject.Named;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.dao.AmazonMovieDAO;
import info.interactivesystems.movielandscape.dao.MovieDAO;
import info.interactivesystems.movielandscape.exceptions.NoSuchItemException;
import info.interactivesystems.movielandscape.recommender.OnlineRecommender;
import info.interactivesystems.movielandscape.recommender.RecommenderService;
import info.interactivesystems.movielensmetadata.commons.Movie;

@Named
@SessionScoped
public class RecommendationBean implements Serializable {
    private static final Logger log = LoggerFactory.getLogger(RecommendationBean.class);

    private static final int HOW_MANY_RECOMMENDATIONS = 6;

    private static final long serialVersionUID = 10L;

    private List<Movie> recommendations;

    private Map<MovieMapItem, Double> userPreferences;
    private double[] userFeatures;
    private Map<MovieMapItem, Double> systemEstimations;
    
    private OnlineRecommender recommender;

    @Inject
    private RecommenderService recommenderService;

    @Inject
    private MapItemBean mapItemBean;

    @Inject
    private MovieDAO movieDao;
    
    @Inject
    private UserBean userBean;
    
    @Inject
    private AmazonMovieDAO amazonMovieDao;

    @PostConstruct
    public void init() {
	recommendations = new ArrayList<>();
	systemEstimations = new HashMap<>();
	recommender = recommenderService.getRecommender();
	setUserPreferences(createNeutralUserPreferences());
    }

    private Map<MovieMapItem, Double> createNeutralUserPreferences() {
	Map<MovieMapItem, Double> userPreferences = new HashMap<>();
	for (MovieMapItem mapItem : mapItemBean.getAllMapItems()) {
	    userPreferences.put(mapItem, 1d);
	}
	return userPreferences;
    }

    public void notifyPreferenceUpdate() {
	calculateSystemEstimations();
	calculateRecommendations();
    }

    public void setUserPreferences(Map<MovieMapItem, Double> userPreferences) {
	this.userPreferences = userPreferences;
	Map<Long, Double> movielensPreferenceMap = new HashMap<>();
	for (MovieMapItem mapItem : this.userPreferences.keySet()) {
	    movielensPreferenceMap.put(mapItem.getMovielensId(), this.userPreferences.get(mapItem));
	}
	userFeatures = recommender.computeUserVector(movielensPreferenceMap);
	notifyPreferenceUpdate();
    }

    public void calculateSystemEstimations() {
	Map<Long, Double> estimatedPreferences = recommender.estimatePreferences(userFeatures);
	systemEstimations.clear();
	for (MovieMapItem mapItem : mapItemBean.getAllMapItems()) {
	    systemEstimations.put(mapItem, estimatedPreferences.get(mapItem.getMovielensId()));
	}
    }

    public void calculateRecommendations() {
	List<MovieMapItem> recommendationMapItems = calculateRecommendations(HOW_MANY_RECOMMENDATIONS);
	recommendations = recommendationMapItems.stream().map(mapItem -> movieDao.findMovie(mapItem.getMovielensId()))
		.collect(Collectors.toList());
    }

    private List<MovieMapItem> calculateRecommendations(int howMany) {
	log.debug("Calculate recommendations for user {}", userBean.getAccount().getId());
	double weight = 0.3;
	Map<MovieMapItem, Double> blendedPreferences = new HashMap<>();
	for (MovieMapItem mapItem : userPreferences.keySet()) {
	    double blendedPreference = userPreferences.get(mapItem) * (weight)
		    + systemEstimations.get(mapItem) * (1 - weight);
	    blendedPreferences.put(mapItem, blendedPreference);
	}
	List<MovieMapItem> sortedCandidates = new ArrayList<>(getCandidates());
	Collections.sort(sortedCandidates, new Comparator<MovieMapItem>() {
	    @Override
	    public int compare(MovieMapItem o1, MovieMapItem o2) {
		Double recommendationValueItem1 = blendedPreferences.get(o1);
		Double recommendationValueItem2 = blendedPreferences.get(o2);
		return recommendationValueItem2.compareTo(recommendationValueItem1);
	    }

	});
	return sortedCandidates.subList(0, howMany);
    }

    private Collection<MovieMapItem> getCandidates() {
	Collection<Long> blockedItems = userBean.getUser().getConfiguration().getBlockedMovielensIds();
	Collection<MovieMapItem> candidates = mapItemBean.getAllMapItems().stream()
		.filter(item -> !blockedItems.contains(item.getMovielensId()))
		.collect(Collectors.toSet());
	if(userBean.getUser().getConfiguration().isRestrictToPrime()) {
	    Collection<Long> moviesAvailableAtPrime = amazonMovieDao.getMovielensIdsAvailableAtPrime();
	    candidates = candidates.stream()
		    .filter(item -> moviesAvailableAtPrime.contains(item.getMovielensId()))
		    .collect(Collectors.toSet());
	}
	return candidates;
    }

    public void clear() {
	setUserPreferences(createNeutralUserPreferences());
    }

    public Collection<Movie> getRecommendations() {
	return recommendations;
    }

    public Collection<MovieMapItem> getRecommendationMapItems() {
	return recommendations.stream().map(movie -> {
	    try {
		return mapItemBean.getMapItem(movie.getMovieLensId());
	    } catch (NoSuchItemException e) {
		throw new RuntimeException(e);
	    }
	}).collect(Collectors.toList());
    }

    public Map<MovieMapItem, Double> getUserPreferences() {
	return userPreferences;
    }

    public Map<MovieMapItem, Double> getSystemEstimations() {
	return systemEstimations;
    }
}
