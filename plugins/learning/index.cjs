const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {readFileSync} = require('node:fs');
module.exports = function learningRoutes(context) {
  return {
    name: 'learning-lesson-routes',
    async loadContent() {
      const module = await import(
        pathToFileURL(path.join(context.siteDir, 'src/data/learning/roadmap.mjs')).href
      );
      return module.lessons.map((lesson) => ({
        ...lesson,
        docLinks: lesson.relatedDocs.map((route) => {
          const source = readFileSync(
            path.join(context.siteDir, 'docs', `${route.slice(1)}.md`),
            'utf8',
          );
          const title =
            source.match(/^title:\s*(.+)$/m)?.[1] || source.match(/^#\s+(.+)$/m)?.[1] || route;
          return {route, title: title.replace(/^['"]|['"]$/g, '')};
        }),
      }));
    },
    async contentLoaded({content, actions}) {
      for (const lesson of content) {
        const data = await actions.createData(`${lesson.id}.json`, JSON.stringify(lesson));
        actions.addRoute({
          path: `/learn/lesson/${lesson.id}`,
          exact: true,
          component: '@site/src/components/learning/LessonPage.jsx',
          modules: {lessonData: data},
        });
      }
    },
    getPathsToWatch() {
      return [
        path.join(context.siteDir, 'src/data/learning/*.mjs'),
        path.join(context.siteDir, 'docs/**/*.md'),
      ];
    },
  };
};
