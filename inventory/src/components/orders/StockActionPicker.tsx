import { Radio, Stack, Text } from '@mantine/core';
import type { StockAction } from '@/lib/api/orderEdit';

/**
 * For items already poured or sent: does the stock go back on the shelf, or is it a loss?
 * Kitchen food can never go back, so only "waste" is offered there.
 */
export function StockActionPicker({
  value,
  onChange,
  canReturn,
}: {
  value: StockAction;
  onChange: (v: StockAction) => void;
  canReturn: boolean;
}) {
  return (
    <Radio.Group
      label="What happens to the stock?"
      value={canReturn ? value : 'waste'}
      onChange={(v) => onChange(v as StockAction)}
    >
      <Stack gap="xs" mt={6}>
        {canReturn && (
          <Radio
            value="return"
            label="Back on the shelf"
            description="Unopened bottle or can, still sellable. Stock goes back up."
          />
        )}
        <Radio
          value="waste"
          label="Write off as waste"
          description={
            canReturn
              ? 'Opened, spilled or can not be sold again. Recorded as waste at cost.'
              : 'Food already sent from the kitchen can not go back. Recorded as waste at cost.'
          }
        />
      </Stack>
      {!canReturn && (
        <Text size="xs" c="dimmed" mt={4}>
          Only bar drinks can go back on the shelf.
        </Text>
      )}
    </Radio.Group>
  );
}
