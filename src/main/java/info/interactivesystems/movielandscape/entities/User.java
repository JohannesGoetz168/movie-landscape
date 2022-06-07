package info.interactivesystems.movielandscape.entities;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.SequenceGenerator;
import javax.transaction.Transactional;

@Entity
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "user_seq")
    private long id;
    
    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Configuration configuration;
    
    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Statistics statistics;
    
    public User() {
	super();
	configuration = new Configuration();
	statistics = new Statistics();
    }
    
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Configuration getConfiguration() {
        return configuration;
    }

    @Transactional
    public void setConfiguration(Configuration configuration) {
        this.configuration = configuration;
    }

    public Statistics getStatistics() {
        return statistics;
    }

    @Transactional
    public void setStatistics(Statistics statistics) {
        this.statistics = statistics;
    }
    
    @Override
    public int hashCode() {
	final int prime = 31;
	int result = 1;
	result = prime * result + (int) (id ^ (id >>> 32));
	return result;
    }

    @Override
    public boolean equals(Object obj) {
	if (this == obj)
	    return true;
	if (obj == null)
	    return false;
	if (getClass() != obj.getClass())
	    return false;
	User other = (User) obj;
	if (id != other.id)
	    return false;
	return true;
    }

}
