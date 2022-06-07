package info.interactivesystems.movielandscape.entities;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.SequenceGenerator;

@Entity
public class Configuration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "configuration_seq")
    @SequenceGenerator(name = "configuration_seq", sequenceName = "configuration_seq")
    private long id;
    
    @Column(name = "restrict_to_prime")
    private boolean restrictToPrime;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name="blocked_movies", joinColumns=@JoinColumn(name="configuration_id", referencedColumnName="id"))
    @Column(name = "movielens_id")
    private Set<Long> blockedMovielensIds;
    
    @Column(name = "sculpt_amount")
    private double sculptAmount;
    
    @Column(name = "sculpt_patch_size")
    private double sculptPatchSize;
    
    public Configuration() {
	super();
	blockedMovielensIds = new HashSet<>();
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public boolean isRestrictToPrime() {
        return restrictToPrime;
    }

    public void setRestrictToPrime(boolean restrictToPrime) {
        this.restrictToPrime = restrictToPrime;
    }

    public Set<Long> getBlockedMovielensIds() {
        return blockedMovielensIds;
    }

    public void setBlockedMovielensIds(Set<Long> blockedMovielensIds) {
        this.blockedMovielensIds = blockedMovielensIds;
    }
    
    public void addBlockedMovie(Long blockedMovieId) {
	blockedMovielensIds.add(blockedMovieId);
    }
    
    public void removeBlockedMovie(Long blockedMovieId) {
	blockedMovielensIds.remove(blockedMovieId);
    }
    
    public void addAllBlockedMovies(Collection<Long> blockedMovieIds) {
	this.blockedMovielensIds.addAll(blockedMovieIds);
    }

    public double getSculptAmount() {
        return sculptAmount;
    }

    public void setSculptAmount(double sculptAmount) {
        this.sculptAmount = sculptAmount;
    }

    public double getSculptPatchSize() {
        return sculptPatchSize;
    }

    public void setSculptPatchSize(double sculptPatchSize) {
        this.sculptPatchSize = sculptPatchSize;
    }
}
