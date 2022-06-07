package info.interactivesystems.movielandscape;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.enterprise.context.SessionScoped;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.inject.Named;

import org.primefaces.context.RequestContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.mapitems.MapItem;
import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.exceptions.NoSuchItemException;
import info.interactivesystems.movielandscape.utils.JsonUtils;

@Named
@SessionScoped
public class TerrainSceneBean implements Serializable {
	private static final Logger log = LoggerFactory.getLogger(TerrainSceneBean.class);
	private static final long serialVersionUID = 20L;

	@Inject
	private DetailsBean detailsBean;

	@Inject
	private MapItemBean mapItemBean;

	@Inject
	private RecommendationBean recommendationsBean;

	@Inject
	private SampleItemsBean sampleBean;
	
	public void changeCurrentItem() {
		FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		long itemId = Long.parseLong(map.get("itemId"));
		if (detailsBean.getCurrentItem() == null || detailsBean.getCurrentItem().getId() != itemId) {
			try {
				MapItem currentItem = mapItemBean.getMapItem(itemId);
				detailsBean.changeCurrentItem((MovieMapItem) currentItem);
			} catch (NoSuchItemException e) {
				log.warn("Cannot change item, due to there is none with id {}!", itemId);
			}
		}
	}

	public void changePreferences() {
		Map<MovieMapItem, Double> changedPreferences = getPreferencesFromFacesContext();
		log.debug("Got changed items");
		recommendationsBean.setUserPreferences(changedPreferences);
	}

	private Map<MovieMapItem, Double> getPreferencesFromFacesContext() {
		Map<MovieMapItem, Double> preferences = new HashMap<>();

		FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		List<List<String>> preferenceMap = JsonUtils.getHeightDataFromJson(map.get("preferenceMap"));
		for (List<String> preferenceMapping : preferenceMap) {
			String movielensId = preferenceMapping.get(0);
			String preference = preferenceMapping.get(1);
			try {
				MovieMapItem mapItem = mapItemBean.getMapItem(Long.parseLong(movielensId));
				preferences.put(mapItem, Double.parseDouble(preference));
			} catch (NumberFormatException | NoSuchItemException e) {
				log.warn("Could not find map item with id '{}' due to error: {}", movielensId, e.getLocalizedMessage());
			}
		}
		return preferences;
	}

	public void addSample() {
		FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		String xParameter = map.get("x");
		String yParameter = map.get("y");
		if (xParameter != null && yParameter != null) {
			double x = Double.parseDouble(xParameter);
			double y = Double.parseDouble(yParameter);
			MovieMapItem addedBean = sampleBean.addSampleAt(x, y);
			this.detailsBean.changeCurrentItem(addedBean);
			RequestContext requestContext = RequestContext.getCurrentInstance();
			requestContext.execute("landscapeFacade.addSample(" + addedBean.getMovielensId() + ")");
		}
	}

	public void removeSample() {
		FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		String itemId = map.get("itemId");
		if (itemId != null) {
			try {
				MapItem item = mapItemBean.getMapItem(Long.parseLong(itemId));
				sampleBean.removeSample(item);
				log.trace("Remove item: {}", itemId);
			} catch (NoSuchItemException e) {
				log.error("Could not retrieve item.", e);
			}
		}
	}

	public String getAllItemsAsJson() {
		return JsonUtils.mapItemsToJson(mapItemBean.getAllMapItems());
	}

	public String getSamplesAsJson() {
		return JsonUtils.mapItemsToJson(sampleBean.getSampleMapItems());
	}
	
	public String getRecommendationsAsJson() {
		return JsonUtils.mapItemsToJson(recommendationsBean.getRecommendationMapItems());
	}

	public String getUserPreferencesAsJson() {
		Map<Long, Double> plainPreferences = new HashMap<>();
		if(recommendationsBean.getUserPreferences() == null){
			return null;
		}
		for (MovieMapItem mapItem : recommendationsBean.getUserPreferences().keySet()) {
			plainPreferences.put(mapItem.getMovielensId(), recommendationsBean.getUserPreferences().get(mapItem));
		}
		return JsonUtils.toJson(plainPreferences);
	}
	
	public String getSystemEstimationsAsJson() {
		Map<Long, Double> plainSystemEstimations = new HashMap<>();
		if(recommendationsBean.getSystemEstimations() == null){
			return null;
		}
		for (MovieMapItem mapItem : recommendationsBean.getSystemEstimations().keySet()) {
			plainSystemEstimations.put(mapItem.getMovielensId(), recommendationsBean.getSystemEstimations().get(mapItem));
		}
		return JsonUtils.toJson(plainSystemEstimations);
	}
}
