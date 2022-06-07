package info.interactivesystems.movielandscape.sampling;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import info.interactivesystems.mapviews.mapitems.MovieMapItem;
import info.interactivesystems.movielandscape.sampling.kmeans.KMeansAlgorithm;
import info.interactivesystems.movielandscape.sampling.kmeans.MapItemCluster;

public class KMeansSampler implements MapItemSampler<MovieMapItem>{
	
	private KMeansAlgorithm algorithm;
	private Collection<MapItemCluster> clusters;

	public Map<MovieMapItem, Collection<MovieMapItem>> getClusters(){
		Map<MovieMapItem, Collection<MovieMapItem>> clusters = new HashMap<MovieMapItem, Collection<MovieMapItem>>();
		for(MapItemCluster cluster : this.clusters){
			clusters.put(cluster.getSampleItem(), cluster.getItems());
		}
		return clusters;
	}
	
	@Override
	public Collection<MovieMapItem> sampleItems(Collection<MovieMapItem> allItems, int howMany) {
		if(clusters == null || clusters.size() != howMany){
			algorithm = new KMeansAlgorithm(allItems, howMany);
			clusters = algorithm.performKMeans(0.2);
		}
		return getSampleItems(clusters);
	}
	
	private Collection<MovieMapItem> getSampleItems(Collection<MapItemCluster> clusters) {
		Collection<MovieMapItem> sampleItems = new ArrayList<>();
		for(MapItemCluster cluster : clusters){
			MovieMapItem sampleItem = cluster.getSampleItem();
			if(sampleItem != null){
				sampleItems.add(sampleItem);
			}
		}
		return sampleItems;
	}

}
