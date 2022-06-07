package info.interactivesystems.movielandscape.sampling;

import java.util.Collection;

import info.interactivesystems.mapviews.mapitems.MapItem;

public interface MapItemSampler<T extends MapItem> {

	public Collection<T> sampleItems(Collection<T> allItems, int howMany);
}
