import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroOverlay} />
      <div className={clsx('container', styles.heroContent)}>
        <div className={styles.heroEmoji}>📱</div>
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroButtons}>
          <Link className={styles.heroPrimary} to="/docs/">
            Get Started →
          </Link>
          <Link className={styles.heroSecondary} to="/docs/interview/">
            Interview Prep 💬
          </Link>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>36+</span>
            <span className={styles.statLabel}>Articles</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>9</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Kotlin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Comprehensive Android development knowledge base — Kotlin, Architecture, Jetpack, and interview preparation.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
