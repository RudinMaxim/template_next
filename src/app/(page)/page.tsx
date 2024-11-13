import { useContent } from '@/shared/hooks';
import { envManager } from '@/shared/lib';

import { PageContent } from '../types/page.types';

export default function Home() {
  const content = useContent<PageContent>('common', { allowHtml: true });

  console.log(envManager.get('windir'));

  return (
    <main>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <div dangerouslySetInnerHTML={{ __html: content.content }} />

      {JSON.stringify(envManager)}
    </main>
  );
}
