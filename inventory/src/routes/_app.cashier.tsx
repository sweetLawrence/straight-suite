import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Box, Button, Card, Group, Loader, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { ArrowUpRight, ChevronRight, HandCoins, Receipt, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { RemitCashModal } from '@/components/cashier/RemitCashModal';
import { PettyCashModal } from '@/components/cashier/PettyCashModal';
import { useCashiers, useCashierSummary } from '@/hooks/useCashier';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { C, METHOD_OF, REMIT_STATUS, Money, Row, Section } from '@/components/cashier/CashParts';
import type { PayMethod, Remittance } from '@/lib/api/cashier';

export const Route = createFileRoute('/_app/cashier')({
  component: CashierPage,
});

const METHOD: Record<string, string> = { mpesa: 'M-Pesa', card: 'Card', cheque: 'Cheque', other: 'Other', house: 'House' };

type When = 'today' | 'yesterday' | 'date';

function CashierPage() {
  const auth = useAuth();
  const oversight = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const canPickPerson = oversight || auth.hasRole('manager', 'supervisor');
  const people = useCashiers(canPickPerson);
  const [personId, setPersonId] = useState<string | null>(null);
  const [when, setWhen] = useState<When>('today');
  const [date, setDate] = useState<string | null>(dayjs().subtract(2, 'day').format('YYYY-MM-DD'));
  const [remitOpen, setRemitOpen] = useState(false);
  const [remitOnly, setRemitOnly] = useState<PayMethod | null>(null);
  const [pettyOpen, setPettyOpen] = useState(false);

  // The MD has no cash of their own: start on the first cashier
  useEffect(() => {
    if (oversight && !personId && people.data?.length) {
      setPersonId((people.data.find((p) => p.role === 'cashier') || people.data[0]).id);
    }
  }, [oversight, personId, people.data]);

  const day =
    when === 'yesterday'
      ? dayjs().subtract(6, 'hour').subtract(1, 'day').format('YYYY-MM-DD')
      : when === 'date'
      ? date || undefined
      : undefined;

  const viewingSelf = !personId || personId === auth.user?.id;
  const query = useCashierSummary(
    { date: day, cashier_id: viewingSelf ? undefined : personId || undefined },
    !oversight || !!personId
  );
  const s = query.data;
  const waitingForMd = (s?.remittances ?? []).some((r) => r.status === 'pending');
  const canRemit = viewingSelf && auth.hasPermission('cash.remit');
  const canPetty = viewingSelf && auth.hasPermission('petty_cash.record');

  const personOptions = [
    ...(oversight ? [] : [{ value: auth.user?.id || 'me', label: 'Me' }]),
    ...(people.data ?? [])
      .filter((p) => p.id !== auth.user?.id)
      .map((p) => ({ value: p.id, label: `${p.full_name}${p.property && oversight ? ` · ${p.property}` : ''}` })),
  ];

  return (
    <>
      <PageHeader
        title={viewingSelf ? 'My money' : `Money · ${s?.cashier.full_name ?? ''}`}
        subtitle={
          <>
            Cash, M-Pesa, card and more: taken, paid out, and handed to the MD
            {query.isFetching && <Loader size={10} ml={8} />}
          </>
        }
      />

      <Group gap="sm" mb="md" align="flex-end" wrap="wrap">
        {canPickPerson && (
          <Select
            label="Cashier"
            data={personOptions}
            value={personId || auth.user?.id || null}
            onChange={setPersonId}
            searchable
            w={{ base: '100%', xs: 240 }}
            allowDeselect={false}
          />
        )}
        <Select
          label="Day"
          data={[
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'date', label: 'Pick a day' },
          ]}
          value={when}
          onChange={(v) => setWhen((v as When) || 'today')}
          allowDeselect={false}
          w={{ base: when === 'date' ? '48%' : '100%', xs: 160 }}
        />
        {when === 'date' && (
          <DatePickerInput
            label="Date"
            value={date}
            onChange={(v) => setDate(v ? dayjs(v).format('YYYY-MM-DD') : null)}
            maxDate={new Date()}
            valueFormat="D MMM YYYY"
            w={{ base: '48%', xs: 170 }}
          />
        )}
      </Group>

      {oversight && !personId && !people.isLoading && !people.data?.length ? (
        <EmptyState title="No cashiers yet" description="People who take cash drops show here." />
      ) : query.isLoading || (oversight && !personId) ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error || !s ? (
        <EmptyState title="Couldn't load cash" description={query.error ? getErrorMessage(query.error) : ''} />
      ) : (
        <Stack gap="md">
          {/* Money in hand, all time, by method */}
          <Card radius="lg" p="lg" style={{ background: C.navy, color: '#FFFFFF' }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box>
                <Text size="sm" style={{ color: C.navyText }}>
                  Money in hand now
                </Text>
                <Text fw={800} fz={{ base: 30, sm: 36 }} lh={1.15} style={{ letterSpacing: '-0.02em' }}>
                  {formatCurrency(s.total_in_hand)}
                </Text>
              </Box>
              <Wallet size={28} color={C.navyText} />
            </Group>
            <Stack gap={6} mt="sm">
              {s.holdings
                .filter((h) => h.in_hand !== 0 || h.method === 'cash')
                .map((h) => (
                  <Group
                    key={h.method}
                    justify="space-between"
                    wrap="nowrap"
                    px="sm"
                    py={6}
                    style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, cursor: canRemit && h.in_hand > 0 ? 'pointer' : undefined }}
                    onClick={() => {
                      if (canRemit && h.in_hand > 0) {
                        setRemitOnly(h.method);
                        setRemitOpen(true);
                      }
                    }}
                  >
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={700}>{METHOD_OF[h.method].label}</Text>
                      <Text size="xs" style={{ color: C.navyText }}>
                        Took {formatCurrency(h.taken)}
                        {h.petty_cash ? ` · petty ${formatCurrency(h.petty_cash)}` : ''} · handed {formatCurrency(h.handed_over)}
                      </Text>
                    </Box>
                    <Text fw={800} style={{ whiteSpace: 'nowrap' }}>{formatCurrency(h.in_hand)}</Text>
                  </Group>
                ))}
            </Stack>
            {waitingForMd && (
              <Badge mt="sm" variant="filled" style={{ background: C.orange }}>
                A handover is waiting for the MD
              </Badge>
            )}
            {(canRemit || canPetty) && (
              <SimpleGrid cols={2} spacing="sm" mt="md">
                {canRemit && (
                  <Button
                    leftSection={<HandCoins size={18} />}
                    style={{ background: '#FFFFFF', color: C.navy }}
                    disabled={s.total_in_hand <= 0}
                    onClick={() => {
                      setRemitOnly(null);
                      setRemitOpen(true);
                    }}
                  >
                    Hand to MD
                  </Button>
                )}
                {canPetty && (
                  <Button
                    variant="outline"
                    leftSection={<Receipt size={18} />}
                    style={{ borderColor: C.navyText, color: '#FFFFFF' }}
                    onClick={() => setPettyOpen(true)}
                  >
                    Petty cash
                  </Button>
                )}
              </SimpleGrid>
            )}
          </Card>

          {/* Shortages: cash that did not arrive */}
          <Card withBorder radius="md" p="sm" style={{ background: (s.shortages?.handover_total ?? 0) + (s.shortages?.rejected_drops_total ?? 0) > 0 ? '#FFF5F5' : '#F8F9FA' }}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" fw={700}>Shortages</Text>
              <Text fw={800} style={{ color: (s.shortages?.handover_total ?? 0) > 0 ? '#C92A2A' : '#495057' }}>
                {formatCurrency(s.shortages?.handover_total ?? 0)}
              </Text>
            </Group>
            {(s.shortages?.handover ?? []).slice(0, 5).map((x) => (
              <Text key={x.ref} size="xs" c="dimmed">
                {x.ref}: handed {formatCurrency(x.handed)}, counted {formatCurrency(x.received)}, short {formatCurrency(x.short)}
              </Text>
            ))}
            {(s.shortages?.rejected_drops_total ?? 0) > 0 && (
              <Text size="xs" c="red">
                Cash drops disputed: {formatCurrency(s.shortages!.rejected_drops_total)} ({s.shortages!.rejected_drops.length})
              </Text>
            )}
            {!s.shortages?.handover.length && !(s.shortages?.rejected_drops_total) && (
              <Text size="xs" c="dimmed">None. Every handover matched.</Text>
            )}
          </Card>

          {viewingSelf && s.drops_waiting > 0 && auth.hasPermission('cash.drop.verify') && (
            <Card withBorder radius="md" p="sm" component={Link} to="/cash-drops" style={{ background: '#FFF4E6' }}>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                  <StatusDot color={C.orange} />
                  <Text size="sm" fw={600} style={{ color: '#D9480F' }}>
                    {s.drops_waiting} cash drop{s.drops_waiting === 1 ? '' : 's'} waiting to be confirmed
                  </Text>
                </Group>
                <ChevronRight size={16} color="#D9480F" />
              </Group>
            </Card>
          )}

          {/* The chosen day */}
          <Text size="xs" fw={700} tt="uppercase" style={{ color: '#495057', letterSpacing: 0.4 }}>
            {dayjs(s.date).format('dddd D MMM')}
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Stat label="Drops taken" value={formatCurrency(s.today.drops_received)} hint={`${s.drops.length} drops`} />
            <Stat label="Petty cash" value={formatCurrency(s.today.petty_cash)} hint={`${s.petty.length} payments`} />
            <Stat label="Handed to MD" value={formatCurrency(s.today.handed_over)} hint={`${s.remittances.length} handovers`} />
            <Stat
              label="Payments checked"
              value={String(s.today.checked.reduce((a, x) => a + x.count, 0))}
              hint={
                s.today.checked.length
                  ? [...new Set(s.today.checked.map((x) => METHOD[x.method] || x.method))].join(', ')
                  : 'M-Pesa, card, cheque'
              }
            />
          </SimpleGrid>

          <TakingsCard s={s} />

          <Section title="Handed to the MD" empty="Nothing handed over this day" count={s.remittances.length}>
            {s.remittances.map((r) => {
              const st = REMIT_STATUS[r.status];
              return (
                <Row key={r.id}>
                  <Box style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap">
                      <StatusDot color={st.color} />
                      <Text size="sm" fw={600}>
                        {st.label}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {r.remit_ref} · {dayjs(r.created_at).format('HH:mm')}
                      {r.receiver ? ` · ${r.receiver.full_name}` : ''}
                    </Text>
                    <MethodsLine r={r} />
                    {r.status === 'disputed' && (
                      <Text size="xs" style={{ color: C.red }}>
                        MD got {formatCurrency(r.received_amount)}: {r.dispute_reason}
                      </Text>
                    )}
                  </Box>
                  <Money value={r.amount} />
                </Row>
              );
            })}
          </Section>

          <Section title="Cash drops taken" empty="No cash drops confirmed this day" count={s.drops.length}>
            {s.drops.map((d) => (
              <Row key={d.id} to={`/cash-drops/${d.id}`}>
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {d.waiter || 'Waiter'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {d.drop_ref} · {d.outlet === 'bar' ? 'Bar' : 'Restaurant'} · {dayjs(d.at).format('HH:mm')}
                  </Text>
                </Box>
                <Money value={d.amount} />
              </Row>
            ))}
          </Section>

          <Section title="Petty cash paid" empty="No petty cash this day" count={s.petty.length}>
            {s.petty.map((p) => (
              <Row key={p.id}>
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {p.description}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {p.kind === 'stock' && p.item ? `${p.quantity} × ${p.item}` : p.category}
                    {p.payee ? ` · ${p.payee}` : ''} · {dayjs(p.at).format('HH:mm')}
                  </Text>
                </Box>
                <Money value={-p.amount} />
              </Row>
            ))}
          </Section>

          <Group justify="center" gap="md">
            <Button variant="subtle" size="xs" component={Link} to="/cash-handovers" rightSection={<ArrowUpRight size={14} />}>
              All handovers
            </Button>
            <Button variant="subtle" size="xs" component={Link} to="/petty-cash" rightSection={<ArrowUpRight size={14} />}>
              All petty cash
            </Button>
          </Group>
        </Stack>
      )}

      <RemitCashModal opened={remitOpen} onClose={() => setRemitOpen(false)} holdings={s?.holdings ?? []} only={remitOnly} />
      <PettyCashModal opened={pettyOpen} onClose={() => setPettyOpen(false)} inHand={s?.cash.in_hand ?? 0} />
    </>
  );
}

/** What the property took this day, by method: checked, or still waiting to be checked */
function TakingsCard({ s }: { s: NonNullable<ReturnType<typeof useCashierSummary>['data']> }) {
  const rows = s.takings.by_method.filter((x) => x.total > 0 || x.failed > 0);
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Text fw={600} size="sm">Money taken at the property</Text>
        <Text fw={800} size="sm" style={{ color: C.navy }}>{formatCurrency(s.takings.total)}</Text>
      </Group>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed" px="md" py="md">No payments this day</Text>
      ) : (
        rows.map((x) => {
          const m = METHOD_OF[x.method];
          return (
            <Group key={x.method} justify="space-between" wrap="nowrap" px="md" py="xs" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                <Box w={10} h={10} style={{ borderRadius: 999, background: m.color, flexShrink: 0 }} />
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600}>{m.label}</Text>
                  <Text size="xs" c="dimmed">
                    {x.count} payment{x.count === 1 ? '' : 's'}
                    {x.waiting > 0 ? ` · ${formatCurrency(x.waiting)} not checked yet` : ''}
                    {x.events > 0 ? ` · events ${formatCurrency(x.events)}` : ''}
                    {x.failed > 0 ? ` · ${formatCurrency(x.failed)} failed` : ''}
                  </Text>
                </Box>
              </Group>
              <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: m.color }}>{formatCurrency(x.total)}</Text>
            </Group>
          );
        })
      )}
    </Card>
  );
}

/** "Cash 5,000 · M-Pesa 12,000" for a handover */
function MethodsLine({ r }: { r: Remittance }) {
  if (r.lines.length <= 1 && r.lines[0]?.method === 'cash') return null;
  return (
    <Text size="xs" style={{ color: C.navy }}>
      {r.lines.map((l) => `${METHOD_OF[l.method]?.label ?? l.method} ${formatCurrency(l.amount)}`).join(' · ')}
    </Text>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card withBorder radius="md" p="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={800} fz={{ base: 17, sm: 20 }} style={{ color: C.navy, whiteSpace: 'nowrap' }}>
        {value}
      </Text>
      <Text size="xs" c="dimmed" truncate>
        {hint}
      </Text>
    </Card>
  );
}

