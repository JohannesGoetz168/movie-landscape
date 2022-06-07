package info.interactivesystems.movielandscape.sampling.kmeans;

import java.util.Collection;
import java.util.HashSet;

import info.interactivesystems.mapviews.commons.util.MathUtils;
import info.interactivesystems.mapviews.mapitems.MovieMapItem;

public class MapItemCluster{
	private Collection<MovieMapItem> items;
	private Centroid centroid;
	
	MapItemCluster(){
		items = new HashSet<>();
	}
	
	Centroid generateRandomCentroid(double xMin, double xMax, double yMin, double yMax){
		centroid = new Centroid();
		centroid.setX(randomValue(xMin, xMax));
		centroid.setY(randomValue(yMin, yMax));
		return centroid;
	}
	private double randomValue(double min, double max){
		double factor = Math.random();
		double range = max-min;
		double random = factor * range;
		return random + min;
		
	}
	
	double moveCentroid(){
		double[] oldPosition = new double[]{centroid.getX(), centroid.getY()};
		double[] newPosition = new double[]{calculateCentroidX(), calculateCentroidY()};
		if(Double.isNaN(newPosition[0]) || Double.isNaN(newPosition[1])){
			newPosition = oldPosition;
		}
		centroid.setPosition(newPosition);
		return MathUtils.calculateEuclideanDistance(oldPosition, newPosition);
	}
	
	public MovieMapItem getSampleItem() {
		double nearestDistance = Double.MAX_VALUE;
		MovieMapItem sampleItem = null;
		for(MovieMapItem item : getItems()){
			double distance = MathUtils.calculateEuclideanDistance(item.getX(), item.getY(), getCentroid().getX(), getCentroid().getY());
			if(distance < nearestDistance){
				nearestDistance = distance;
				sampleItem = item;
			}
		}
		return sampleItem;
	}
	void addItem(MovieMapItem item){
		this.items.add(item);
	}
	void removeItem(MovieMapItem item){
		this.items.remove(item);
	}
	boolean containsItem(MovieMapItem item){
		return this.items.contains(item);
	}
	public Collection<MovieMapItem> getItems() {
		return items;
	}
	Centroid getCentroid() {
		return centroid;
	}
	private double calculateCentroidY() {
		double sum = 0d;
		for(MovieMapItem item : items){
			sum += item.getY();
		}
		return sum/items.size();
	}

	private double calculateCentroidX() {
		double sum = 0d;
		for(MovieMapItem item : items){
			sum += item.getX();
		}
		return sum/items.size();
	}
}