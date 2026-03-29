import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Kotlin & Fundamentals',
    emoji: '🧱',
    description: 'Master Kotlin essentials — coroutines, flows, sealed classes, extension functions, and OOP principles.',
    link: '/docs/foundation/',
    color: '#6C5CE7',
  },
  {
    title: 'Android Core & Architecture',
    emoji: '🏗️',
    description: 'Deep dive into Activities, Fragments, Lifecycle, MVVM, Clean Architecture, and modularization.',
    link: '/docs/architecture/',
    color: '#0984E3',
  },
  {
    title: 'UI & Jetpack Compose',
    emoji: '🎨',
    description: 'Build beautiful interfaces with Jetpack Compose, XML Views, and master Navigation patterns.',
    link: '/docs/ui/',
    color: '#00B894',
  },
  {
    title: 'Data & Networking',
    emoji: '🔄',
    description: 'Room database, DataStore, Retrofit, and Paging 3 — everything for your data layer.',
    link: '/docs/data/',
    color: '#E17055',
  },
  {
    title: 'Performance & Testing',
    emoji: '⚡',
    description: 'Optimize memory, startup time, and profiling. Write reliable tests with JUnit, MockK, and Espresso.',
    link: '/docs/performance/',
    color: '#FDCB6E',
  },
  {
    title: 'Interview Prep',
    emoji: '💬',
    description: 'Curated Android interview questions, system design problems, and real-world engineering practices.',
    link: '/docs/interview/',
    color: '#E84393',
  },
];

function Feature({title, emoji, description, link, color}) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureCard}>
        <div className={styles.featureIcon} style={{'--accent-color': color}}>
          <span>{emoji}</span>
        </div>
        <div className={styles.featureBody}>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDesc}>{description}</p>
        </div>
        <span className={styles.featureArrow}>→</span>
      </Link>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Explore Topics
          </Heading>
          <p className={styles.sectionSubtitle}>
            Structured knowledge for Android developers — from fundamentals to senior-level concepts.
          </p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
