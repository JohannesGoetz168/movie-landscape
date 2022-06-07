package info.interactivesystems.movielandscape.sampling.kmeans;

import java.util.Arrays;
import java.util.Collection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import info.interactivesystems.mapviews.commons.util.MathUtils;
import info.interactivesystems.mapviews.mapitems.MovieMapItem;

public class KMeansAlgorithm{
	private final Logger log = LoggerFactory.getLogger(KMeansAlgorithm.class);
	
	private MapItemCluster[] clusters;
	
	private Collection<MovieMapItem> allItems;
	
	public KMeansAlgorithm(Collection<MovieMapItem> allItems, int clustercount) {
		this.allItems = allItems;
		clusters = new MapItemCluster[clustercount];
		for(int i = 0; i<clustercount; i++){
			MapItemCluster cluster = new MapItemCluster();
			clusters[i] = cluster;
		}
		
	}
	
	public Collection<MapItemCluster> performKMeans(double convergence){
		int iterations = 0;
		double movedDistance;
		generateRandomCentroids();
		do{
			assignMovielensMapItemsToCluster();
			movedDistance = updateCentroids();
			iterations++;
		} while (movedDistance > convergence);
		log.info("Found K-Means convergence of {}, after {} steps.",convergence, iterations);
		return Arrays.asList(clusters);
	}

	private double updateCentroids() {
		double convergance = 0;
		for(MapItemCluster cluster : clusters){
			double movedDistance = cluster.moveCentroid();
			convergance = movedDistance>convergance?movedDistance:convergance;
		}
		return convergance;
	}

	private void assignMovielensMapItemsToCluster() {
		for(MovieMapItem item : allItems){
			double nearestDistance = Double.MAX_VALUE;
			MapItemCluster clusterToAssign = null;
			for(MapItemCluster cluster : clusters){
				double distanceToCluster = getEuclideanDistance(item, cluster.getCentroid());
				if(distanceToCluster < nearestDistance){
					nearestDistance = distanceToCluster;
					clusterToAssign = cluster;
				}
			}
			for(MapItemCluster cluster : clusters){
				if(cluster.containsItem(item)){
					cluster.removeItem(item);
				}
			}
			clusterToAssign.addItem(item);
		}
		
	}

	private double getEuclideanDistance(MovieMapItem item, Centroid centroid) {
		return MathUtils.calculateEuclideanDistance(item.getX(), item.getY(), centroid.getX(), centroid.getY());
	}

	private void generateRandomCentroids() {
		for(MapItemCluster cluster : clusters){
			cluster.generateRandomCentroid(getXMinimum(), getXMaximum(), getYMinimum(), getYMaximum());
		}
		
	}
	
	private double getYMinimum() {
		double yMin = Double.MAX_VALUE;
		for(MovieMapItem item : allItems){
			if(item.getY()<yMin){
				yMin = item.getY();
			}
		}
		return yMin;
	}

	private double getYMaximum() {
		double yMax = Double.MIN_VALUE;
		for(MovieMapItem item : allItems){
			if(item.getY()>yMax){
				yMax = item.getY();
			}
		}
		return yMax;
	}

	private double getXMinimum() {
		double xMin = Double.MAX_VALUE;
		for(MovieMapItem item : allItems){
			if(item.getX()<xMin){
				xMin = item.getX();
			}
		}
		return xMin;
	}

	private double getXMaximum() {
		double xMax = Double.MIN_VALUE;
		for(MovieMapItem item : allItems){
			if(item.getX()>xMax){
				xMax = item.getX();
			}
		}
		return xMax;
	}
	
}