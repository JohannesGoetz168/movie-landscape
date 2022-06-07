package info.interactivesystems.movielandscape.sampling.kmeans;

class Centroid{
	private double x;
	private double y;
	public double getX() {
		return x;
	}
	public void setX(double x) {
		this.x = x;
	}
	public double getY() {
		return y;
	}
	public void setY(double y) {
		this.y = y;
	}
	public void setPosition(double[] newPosition) {
		this.x = newPosition[0];
		this.y = newPosition[1];
	}
}