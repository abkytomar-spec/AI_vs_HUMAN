import { SiteHeader } from '../components/layout/SiteHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusMessage } from '../components/ui/StatusMessage';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <PageContainer className="flex-1 py-16">
        <StatusMessage tone="empty" title="This page does not exist" actions={<ButtonLink to="/">Go to the home page</ButtonLink>}>
          The link may be out of date.
        </StatusMessage>
      </PageContainer>
    </div>
  );
}
